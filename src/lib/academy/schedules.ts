import { Prisma } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";
import { startOfDay } from "@/lib/academy/constants";
import {
  getClassScheduleVisibilityWhere,
  type ViewerContext,
} from "@/lib/academy/access";
import { NotFoundError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { buildOffsetPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import {
  type ClassScheduleFiltersInput,
  type CreateClassScheduleInput,
  type UpdateClassScheduleInput,
  type MutationContext,
  parseDateOnly,
  normalizeOptionalString,
  ensureActiveModality,
  ensureTeacherTeachesModality,
  ensureStudentsAvailable,
  getClassScheduleOptions,
  syncScheduleEnrollments,
} from "@/lib/academy/utils";

export async function getClassSchedulesIndexData(
  viewer: ViewerContext,
  filters: ClassScheduleFiltersInput,
) {
  const where: Prisma.ClassScheduleWhereInput = {
    AND: [
      getClassScheduleVisibilityWhere(viewer),
      filters.search
        ? {
            OR: [
              { title: { contains: filters.search, mode: "insensitive" } },
              { room: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {},
      filters.modalityId ? { modalityId: filters.modalityId } : {},
      filters.teacherId ? { teacherProfileId: filters.teacherId } : {},
      filters.dayOfWeek !== undefined
        ? {
            OR: [
              { dayOfWeek: filters.dayOfWeek },
              { daysOfWeek: { has: filters.dayOfWeek } },
            ],
          }
        : {},
      filters.onlyInactive === true
        ? { isActive: false }
        : filters.onlyInactive === false
          ? { isActive: true }
          : {},
    ],
  };

  const [totalClassSchedules, options] = await Promise.all([
    prisma.classSchedule.count({ where }),
    getClassScheduleOptions(viewer),
  ]);
  const pagination = buildOffsetPagination({
    page: filters.page,
    totalItems: totalClassSchedules,
  });
  const classSchedules = await prisma.classSchedule.findMany({
    where,
    orderBy: [{ isActive: "desc" }, { startTime: "asc" }, { title: "asc" }],
    skip: pagination.skip,
    take: pagination.limit,
    select: {
      id: true,
      title: true,
      description: true,
      dayOfWeek: true,
      daysOfWeek: true,
      startTime: true,
      endTime: true,
      room: true,
      capacity: true,
      isActive: true,
      modality: { select: { id: true, name: true, colorHex: true } },
      teacherProfile: { select: { id: true, user: { select: { name: true } } } },
      _count: {
        select: {
          enrollments: { where: { isActive: true } },
          attendances: true,
        },
      },
    },
  });

  return {
    classSchedules,
    pagination,
    options,
    canManage: hasPermission(viewer.role, "manageClassSchedules"),
  };
}

export async function getClassScheduleDetailData(
  viewer: ViewerContext,
  classScheduleId: string,
) {
  const classSchedule = await prisma.classSchedule.findFirst({
    where: { AND: [getClassScheduleVisibilityWhere(viewer), { id: classScheduleId }] },
    select: {
      id: true,
      title: true,
      description: true,
      modalityId: true,
      teacherProfileId: true,
      dayOfWeek: true,
      daysOfWeek: true,
      startTime: true,
      endTime: true,
      room: true,
      capacity: true,
      isActive: true,
      validFrom: true,
      validUntil: true,
      modality: { select: { id: true, name: true, colorHex: true } },
      teacherProfile: { select: { id: true, user: { select: { name: true, email: true } } } },
      enrollments: {
        orderBy: [{ isActive: "desc" }, { enrolledAt: "desc" }],
        select: {
          id: true,
          isActive: true,
          startsAt: true,
          endsAt: true,
          studentProfile: {
            select: {
              id: true,
              registrationNumber: true,
              status: true,
              user: { select: { name: true, email: true } },
            },
          },
        },
      },
      attendances: {
        take: 12,
        orderBy: [{ classDate: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          classDate: true,
          status: true,
          checkedInAt: true,
          checkedOutAt: true,
          studentProfile: {
            select: {
              id: true,
              registrationNumber: true,
              user: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!classSchedule) {
    throw new NotFoundError("Turma nao encontrada ou indisponivel.");
  }

  return {
    classSchedule,
    options: await getClassScheduleOptions(viewer),
    canManage: hasPermission(viewer.role, "manageClassSchedules"),
  };
}

export async function createClassSchedule(
  input: CreateClassScheduleInput,
  context: MutationContext,
) {
  const actorId = context.viewer.userId;

  const result = await prisma.$transaction(async (tx) => {
    await ensureActiveModality(tx, input.modalityId);
    await ensureTeacherTeachesModality(tx, input.teacherProfileId, input.modalityId);
    await ensureStudentsAvailable(tx, input.studentIds);

    const classSchedule = await tx.classSchedule.create({
      data: {
        title: input.title,
        description: normalizeOptionalString(input.description),
        modalityId: input.modalityId,
        teacherProfileId: input.teacherProfileId,
        dayOfWeek: input.daysOfWeek[0],
        daysOfWeek: input.daysOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        room: normalizeOptionalString(input.room),
        capacity: input.capacity ?? null,
        validFrom: parseDateOnly(input.validFrom),
        validUntil: parseDateOnly(input.validUntil),
        isActive: input.isActive ?? true,
      },
      select: { id: true, title: true },
    });

    await syncScheduleEnrollments({
      tx,
      classScheduleId: classSchedule.id,
      modalityId: input.modalityId,
      studentIds: input.studentIds,
      actorId,
    });

    return classSchedule;
  });

  await logAuditEvent({
    request: context.request,
    actorId,
    action: "CLASS_SCHEDULE_CREATED",
    entityType: "ClassSchedule",
    entityId: result.id,
    summary: `Turma ${result.title} criada.`,
    afterData: {
      modalityId: input.modalityId,
      teacherProfileId: input.teacherProfileId,
      studentCount: input.studentIds.length,
    },
  });

  return result;
}

export async function updateClassSchedule(
  input: UpdateClassScheduleInput,
  context: MutationContext,
) {
  const existing = await prisma.classSchedule.findUnique({
    where: { id: input.id },
    select: {
      id: true,
      title: true,
      modalityId: true,
      teacherProfileId: true,
      isActive: true,
    },
  });

  if (!existing) {
    throw new NotFoundError("Turma nao encontrada.");
  }

  const actorId = context.viewer.userId;

  const result = await prisma.$transaction(async (tx) => {
    await ensureActiveModality(tx, input.modalityId);
    await ensureTeacherTeachesModality(tx, input.teacherProfileId, input.modalityId);
    await ensureStudentsAvailable(tx, input.studentIds);

    const classSchedule = await tx.classSchedule.update({
      where: { id: input.id },
      data: {
        title: input.title,
        description: normalizeOptionalString(input.description),
        modalityId: input.modalityId,
        teacherProfileId: input.teacherProfileId,
        dayOfWeek: input.daysOfWeek[0],
        daysOfWeek: input.daysOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        room: normalizeOptionalString(input.room),
        capacity: input.capacity ?? null,
        validFrom: parseDateOnly(input.validFrom) ?? null,
        validUntil: parseDateOnly(input.validUntil) ?? null,
        isActive: input.isActive ?? true,
      },
      select: { id: true, title: true, modalityId: true, teacherProfileId: true, isActive: true },
    });

    await syncScheduleEnrollments({
      tx,
      classScheduleId: classSchedule.id,
      modalityId: input.modalityId,
      studentIds: input.studentIds,
      actorId,
    });

    return classSchedule;
  });

  await logAuditEvent({
    request: context.request,
    actorId,
    action: "CLASS_SCHEDULE_UPDATED",
    entityType: "ClassSchedule",
    entityId: result.id,
    summary: `Turma ${result.title} atualizada.`,
    beforeData: {
      modalityId: existing.modalityId,
      teacherProfileId: existing.teacherProfileId,
      isActive: existing.isActive,
    },
    afterData: {
      modalityId: result.modalityId,
      teacherProfileId: result.teacherProfileId,
      isActive: result.isActive,
      studentCount: input.studentIds.length,
    },
  });

  return result;
}

export async function archiveClassSchedule(
  classScheduleId: string,
  context: MutationContext,
) {
  const existing = await prisma.classSchedule.findUnique({
    where: { id: classScheduleId },
    select: { id: true, title: true, isActive: true },
  });

  if (!existing) {
    throw new NotFoundError("Turma nao encontrada.");
  }

  await prisma.$transaction([
    prisma.classSchedule.update({
      where: { id: classScheduleId },
      data: { isActive: false },
    }),
    prisma.classEnrollment.updateMany({
      where: { classScheduleId, isActive: true },
      data: { isActive: false, endsAt: startOfDay() },
    }),
  ]);

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: "CLASS_SCHEDULE_ARCHIVED",
    entityType: "ClassSchedule",
    entityId: classScheduleId,
    summary: `Turma ${existing.title} arquivada.`,
    beforeData: { isActive: existing.isActive },
    afterData: { isActive: false },
  });
}
