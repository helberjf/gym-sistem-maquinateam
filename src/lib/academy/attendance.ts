import { AttendanceStatus, GamificationAction, Prisma, StudentStatus, UserRole } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";
import {
  awardPointsSafely,
  POINTS_PER_CHECKIN,
} from "@/lib/academy/gamification";
import { startOfDay } from "@/lib/academy/constants";
import {
  combineWhere,
  ensureVisibleClassSchedule,
  ensureVisibleStudent,
  getAttendanceVisibilityWhere,
  getClassScheduleVisibilityWhere,
  getModalityVisibilityWhere,
  getStudentVisibilityWhere,
  getTeacherVisibilityWhere,
  type ViewerContext,
} from "@/lib/academy/access";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { assertStudentMayAttend } from "@/lib/billing/service";
import {
  type AttendanceFiltersInput,
  type CheckInInput,
  type CheckOutInput,
  type MutationContext,
  parseDateOnly,
  normalizeOptionalString,
  buildDateRangeWhere,
  getClassScheduleOptions,
} from "@/lib/academy/utils";

export async function getAttendancePageData(
  viewer: ViewerContext,
  filters: AttendanceFiltersInput,
) {
  const today = startOfDay();
  const attendanceWhere: Prisma.AttendanceWhereInput = {
    AND: [
      getAttendanceVisibilityWhere(viewer),
      buildDateRangeWhere(filters) ?? {},
      filters.studentId ? { studentProfileId: filters.studentId } : {},
      filters.classScheduleId ? { classScheduleId: filters.classScheduleId } : {},
      filters.status ? { status: filters.status } : {},
      filters.modalityId ? { classSchedule: { modalityId: filters.modalityId } } : {},
      filters.teacherId ? { classSchedule: { teacherProfileId: filters.teacherId } } : {},
    ],
  };

  const [records, todayClasses, classSchedules, modalities, teachers, students] =
    await prisma.$transaction([
      prisma.attendance.findMany({
        where: attendanceWhere,
        take: 120,
        orderBy: [{ classDate: "desc" }, { checkedInAt: "desc" }],
        select: {
          id: true,
          classDate: true,
          status: true,
          notes: true,
          checkedInAt: true,
          checkedOutAt: true,
          studentProfile: {
            select: {
              id: true,
              registrationNumber: true,
              user: { select: { name: true } },
            },
          },
          classSchedule: {
            select: {
              id: true,
              title: true,
              startTime: true,
              endTime: true,
              modality: { select: { id: true, name: true } },
              teacherProfile: { select: { id: true, user: { select: { name: true } } } },
            },
          },
        },
      }),
      prisma.classSchedule.findMany({
        where: {
          AND: [
            getClassScheduleVisibilityWhere(viewer),
            { isActive: true },
            filters.classScheduleId ? { id: filters.classScheduleId } : {},
            filters.modalityId ? { modalityId: filters.modalityId } : {},
            filters.teacherId ? { teacherProfileId: filters.teacherId } : {},
          ],
        },
        orderBy: [{ startTime: "asc" }, { title: "asc" }],
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          dayOfWeek: true,
          daysOfWeek: true,
          room: true,
          capacity: true,
          modality: { select: { id: true, name: true, colorHex: true } },
          teacherProfile: { select: { id: true, user: { select: { name: true } } } },
          enrollments: {
            where: {
              isActive: true,
              ...(filters.studentId ? { studentProfileId: filters.studentId } : {}),
            },
            orderBy: { enrolledAt: "asc" },
            select: {
              id: true,
              studentProfile: {
                select: {
                  id: true,
                  registrationNumber: true,
                  status: true,
                  user: { select: { name: true } },
                },
              },
            },
          },
          attendances: {
            where: { classDate: today },
            select: {
              id: true,
              studentProfileId: true,
              status: true,
              checkedInAt: true,
              checkedOutAt: true,
            },
          },
        },
      }),
      prisma.classSchedule.findMany({
        where: { AND: [getClassScheduleVisibilityWhere(viewer), { isActive: true }] },
        orderBy: [{ startTime: "asc" }, { title: "asc" }],
        select: { id: true, title: true },
      }),
      prisma.modality.findMany({
        where: { AND: [getModalityVisibilityWhere(viewer), { isActive: true }] },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true },
      }),
      prisma.teacherProfile.findMany({
        where: {
          AND: [
            getTeacherVisibilityWhere(viewer),
            { isActive: true, user: { isActive: true } },
          ],
        },
        orderBy: { user: { name: "asc" } },
        select: { id: true, user: { select: { name: true } } },
      }),
      prisma.studentProfile.findMany({
        where: combineWhere(getStudentVisibilityWhere(viewer), {
          user: { isActive: true },
          status: { not: StudentStatus.INACTIVE },
        }),
        orderBy: { user: { name: "asc" } },
        select: {
          id: true,
          registrationNumber: true,
          user: { select: { name: true } },
        },
      }),
    ]);

  const summary = records.reduce(
    (accumulator, record) => {
      accumulator.total += 1;
      accumulator.byStatus[record.status] += 1;
      accumulator.byClass[record.classSchedule.title] =
        (accumulator.byClass[record.classSchedule.title] ?? 0) + 1;
      accumulator.byModality[record.classSchedule.modality.name] =
        (accumulator.byModality[record.classSchedule.modality.name] ?? 0) + 1;
      accumulator.byTeacher[record.classSchedule.teacherProfile.user.name] =
        (accumulator.byTeacher[record.classSchedule.teacherProfile.user.name] ?? 0) + 1;
      return accumulator;
    },
    {
      total: 0,
      byStatus: {
        PENDING: 0,
        CHECKED_IN: 0,
        CHECKED_OUT: 0,
        NO_SHOW: 0,
        CANCELLED: 0,
      } as Record<AttendanceStatus, number>,
      byClass: {} as Record<string, number>,
      byModality: {} as Record<string, number>,
      byTeacher: {} as Record<string, number>,
    },
  );

  return {
    today,
    records,
    todayClasses,
    options: { classSchedules, modalities, teachers, students },
    summary,
    canManage: hasPermission(viewer.role, "manageAttendance"),
  };
}

export async function checkInStudent(
  input: CheckInInput,
  context: MutationContext,
) {
  await ensureVisibleStudent(context.viewer, input.studentProfileId);
  await ensureVisibleClassSchedule(context.viewer, input.classScheduleId);

  if (input.overrideFinancial) {
    if (
      context.viewer.role !== UserRole.ADMIN &&
      context.viewer.role !== UserRole.RECEPCAO
    ) {
      throw new ForbiddenError(
        "Apenas a recepcao ou administrador podem liberar check-in com pendencia financeira.",
      );
    }
  } else {
    await assertStudentMayAttend(input.studentProfileId);
  }

  const classDate = parseDateOnly(input.classDate) ?? startOfDay();
  const checkedInAt = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const enrollment = await tx.classEnrollment.findFirst({
      where: {
        studentProfileId: input.studentProfileId,
        classScheduleId: input.classScheduleId,
        isActive: true,
      },
      select: { id: true },
    });

    if (!enrollment) {
      throw new ConflictError("O aluno nao esta matriculado nesta turma.");
    }

    const existing = await tx.attendance.findUnique({
      where: {
        studentProfileId_classScheduleId_classDate: {
          studentProfileId: input.studentProfileId,
          classScheduleId: input.classScheduleId,
          classDate,
        },
      },
      select: { id: true, status: true, checkedOutAt: true },
    });

    if (
      existing &&
      (existing.status === AttendanceStatus.CHECKED_IN ||
        existing.status === AttendanceStatus.CHECKED_OUT ||
        existing.checkedOutAt)
    ) {
      throw new ConflictError(
        "Ja existe um registro de presenca aberto ou concluido para este aluno hoje.",
      );
    }

    const attendance = existing
      ? await tx.attendance.update({
          where: { id: existing.id },
          data: {
            status: AttendanceStatus.CHECKED_IN,
            checkedInAt,
            checkedOutAt: null,
            checkedInByUserId: context.viewer.userId,
            checkedOutByUserId: null,
            notes: normalizeOptionalString(input.notes),
          },
          select: { id: true },
        })
      : await tx.attendance.create({
          data: {
            studentProfileId: input.studentProfileId,
            classScheduleId: input.classScheduleId,
            classDate,
            status: AttendanceStatus.CHECKED_IN,
            checkedInAt,
            notes: normalizeOptionalString(input.notes),
            checkedInByUserId: context.viewer.userId,
          },
          select: { id: true },
        });

    return attendance;
  });

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: "ATTENDANCE_CHECKED_IN",
    entityType: "Attendance",
    entityId: result.id,
    summary: "Check-in registrado na turma.",
    afterData: {
      studentProfileId: input.studentProfileId,
      classScheduleId: input.classScheduleId,
      classDate: classDate.toISOString(),
    },
  });

  await awardPointsSafely({
    studentId: input.studentProfileId,
    action: GamificationAction.CHECKIN,
    basePoints: POINTS_PER_CHECKIN,
    reason: "Check-in registrado.",
    metadata: {
      attendanceId: result.id,
      classScheduleId: input.classScheduleId,
      classDate: classDate.toISOString(),
    },
  });

  return result;
}

export async function checkOutStudent(
  input: CheckOutInput,
  context: MutationContext,
) {
  const attendance = await prisma.attendance.findFirst({
    where: { AND: [getAttendanceVisibilityWhere(context.viewer), { id: input.attendanceId }] },
    select: {
      id: true,
      status: true,
      checkedOutAt: true,
      notes: true,
      studentProfileId: true,
      classScheduleId: true,
      classDate: true,
    },
  });

  if (!attendance) {
    throw new NotFoundError("Registro de presenca nao encontrado.");
  }

  if (attendance.status !== AttendanceStatus.CHECKED_IN || attendance.checkedOutAt) {
    throw new ConflictError("Somente check-ins abertos podem receber check-out.");
  }

  const updated = await prisma.attendance.update({
    where: { id: input.attendanceId },
    data: {
      status: AttendanceStatus.CHECKED_OUT,
      checkedOutAt: new Date(),
      checkedOutByUserId: context.viewer.userId,
      notes:
        normalizeOptionalString(input.notes) ??
        normalizeOptionalString(attendance.notes) ??
        null,
    },
    select: { id: true },
  });

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: "ATTENDANCE_CHECKED_OUT",
    entityType: "Attendance",
    entityId: updated.id,
    summary: "Check-out registrado na turma.",
    beforeData: { status: attendance.status },
    afterData: {
      status: AttendanceStatus.CHECKED_OUT,
      studentProfileId: attendance.studentProfileId,
      classScheduleId: attendance.classScheduleId,
      classDate: attendance.classDate.toISOString(),
    },
  });

  return updated;
}
