import { Prisma, StudentStatus, UserRole } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { logAuditEvent } from "@/lib/audit";
import { buildRegistrationNumber, startOfDay } from "@/lib/academy/constants";
import {
  combineWhere,
  getStudentVisibilityWhere,
  type ViewerContext,
} from "@/lib/academy/access";
import { NotFoundError, ConflictError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { buildOffsetPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import {
  type StudentFiltersInput,
  type CreateStudentInput,
  type UpdateStudentInput,
  type MutationContext,
  parseDateOnly,
  normalizeOptionalString,
  normalizeOptionalUppercase,
  normalizeStudentUserActive,
  ensureActiveModality,
  ensureTeacherExists,
  getStudentOptions,
} from "@/lib/academy/utils";

export async function getStudentsIndexData(
  viewer: ViewerContext,
  filters: StudentFiltersInput,
) {
  const where = combineWhere(
    getStudentVisibilityWhere(viewer),
    filters.search
      ? {
          OR: [
            { user: { name: { contains: filters.search, mode: "insensitive" } } },
            { user: { email: { contains: filters.search, mode: "insensitive" } } },
            { registrationNumber: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : undefined,
    filters.status ? { status: filters.status } : undefined,
    filters.modalityId ? { primaryModalityId: filters.modalityId } : undefined,
    filters.teacherId ? { responsibleTeacherId: filters.teacherId } : undefined,
    filters.onlyInactive === true
      ? { user: { isActive: false } }
      : filters.onlyInactive === false
        ? { user: { isActive: true } }
        : undefined,
  );

  const [totalStudents, options] = await Promise.all([
    prisma.studentProfile.count({ where }),
    getStudentOptions(viewer),
  ]);
  const pagination = buildOffsetPagination({ page: filters.page, totalItems: totalStudents });
  const students = await prisma.studentProfile.findMany({
    where,
    orderBy: [{ user: { name: "asc" } }],
    skip: pagination.skip,
    take: pagination.limit,
    select: {
      id: true,
      registrationNumber: true,
      status: true,
      joinedAt: true,
      primaryModality: { select: { id: true, name: true, colorHex: true } },
      responsibleTeacher: {
        select: { id: true, user: { select: { name: true } } },
      },
      user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
      enrollments: {
        where: { isActive: true },
        take: 2,
        orderBy: { enrolledAt: "desc" },
        select: {
          id: true,
          classSchedule: { select: { id: true, title: true } },
        },
      },
      _count: { select: { attendances: true, enrollments: true } },
    },
  });

  return {
    students,
    pagination,
    options,
    canManage: hasPermission(viewer.role, "manageStudents"),
  };
}

export async function getStudentDetailData(
  viewer: ViewerContext,
  studentProfileId: string,
) {
  const student = await prisma.studentProfile.findFirst({
    where: combineWhere(getStudentVisibilityWhere(viewer), { id: studentProfileId }),
    select: {
      id: true,
      registrationNumber: true,
      status: true,
      birthDate: true,
      cpf: true,
      city: true,
      state: true,
      joinedAt: true,
      beltLevel: true,
      weightKg: true,
      heightCm: true,
      goals: true,
      notes: true,
      medicalNotes: true,
      primaryModalityId: true,
      responsibleTeacherId: true,
      primaryModality: { select: { id: true, name: true } },
      responsibleTeacher: {
        select: { id: true, user: { select: { name: true, email: true } } },
      },
      user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
      enrollments: {
        where: {
          ...(viewer.role === UserRole.PROFESSOR && viewer.teacherProfileId
            ? { classSchedule: { teacherProfileId: viewer.teacherProfileId } }
            : {}),
        },
        orderBy: [{ isActive: "desc" }, { enrolledAt: "desc" }],
        select: {
          id: true,
          isActive: true,
          startsAt: true,
          endsAt: true,
          notes: true,
          classSchedule: {
            select: {
              id: true,
              title: true,
              startTime: true,
              endTime: true,
              dayOfWeek: true,
              daysOfWeek: true,
              room: true,
              modality: { select: { name: true } },
              teacherProfile: { select: { user: { select: { name: true } } } },
            },
          },
        },
      },
      attendances: {
        where:
          viewer.role === UserRole.PROFESSOR && viewer.teacherProfileId
            ? { classSchedule: { teacherProfileId: viewer.teacherProfileId } }
            : undefined,
        take: 12,
        orderBy: [{ classDate: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          classDate: true,
          status: true,
          checkedInAt: true,
          checkedOutAt: true,
          classSchedule: {
            select: {
              id: true,
              title: true,
              modality: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!student) {
    throw new NotFoundError("Aluno nao encontrado ou indisponivel.");
  }

  return {
    student,
    options: await getStudentOptions(viewer),
    canManage: hasPermission(viewer.role, "manageStudents"),
  };
}

export async function createStudent(
  input: CreateStudentInput,
  context: MutationContext,
) {
  const passwordHash = await hashPassword(input.password);
  const joinedAt = parseDateOnly(input.joinedAt) ?? startOfDay();

  const result = await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictError("Ja existe um usuario com este e-mail.");
    }

    if (input.cpf) {
      const existingCpf = await tx.studentProfile.findUnique({
        where: { cpf: input.cpf },
        select: { id: true },
      });

      if (existingCpf) {
        throw new ConflictError("Ja existe um aluno com este CPF.");
      }
    }

    if (input.primaryModalityId) {
      await ensureActiveModality(tx, input.primaryModalityId);
    }

    if (input.responsibleTeacherId) {
      await ensureTeacherExists(tx, input.responsibleTeacherId);
    }

    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: normalizeOptionalString(input.phone),
        role: UserRole.ALUNO,
        isActive: normalizeStudentUserActive(input.status),
        emailVerified: new Date(),
        passwordHash,
      },
      select: { id: true, name: true, email: true },
    });

    const student = await tx.studentProfile.create({
      data: {
        userId: user.id,
        registrationNumber:
          normalizeOptionalUppercase(input.registrationNumber) ??
          buildRegistrationNumber("ALU", user.id),
        status: input.status,
        primaryModalityId: input.primaryModalityId ?? null,
        responsibleTeacherId: input.responsibleTeacherId ?? null,
        birthDate: parseDateOnly(input.birthDate),
        cpf: input.cpf ?? null,
        city: normalizeOptionalString(input.city),
        state: normalizeOptionalUppercase(input.state),
        joinedAt,
        beltLevel: normalizeOptionalString(input.beltLevel),
        weightKg: input.weightKg ?? null,
        heightCm: input.heightCm ?? null,
        goals: normalizeOptionalString(input.goals),
        notes: normalizeOptionalString(input.notes),
      },
      select: { id: true, registrationNumber: true },
    });

    return { user, student };
  });

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: "STUDENT_CREATED",
    entityType: "StudentProfile",
    entityId: result.student.id,
    summary: `Aluno ${result.user.name} criado pela operacao interna.`,
    afterData: {
      email: result.user.email,
      registrationNumber: result.student.registrationNumber,
      status: input.status,
    },
  });

  return result;
}

export async function updateStudent(
  input: UpdateStudentInput,
  context: MutationContext,
) {
  const existing = await prisma.studentProfile.findUnique({
    where: { id: input.id },
    select: {
      id: true,
      registrationNumber: true,
      status: true,
      user: { select: { id: true, name: true, email: true, isActive: true } },
    },
  });

  if (!existing) {
    throw new NotFoundError("Aluno nao encontrado.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const emailOwner = await tx.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (emailOwner && emailOwner.id !== existing.user.id) {
      throw new ConflictError("Ja existe um usuario com este e-mail.");
    }

    if (input.cpf) {
      const cpfOwner = await tx.studentProfile.findUnique({
        where: { cpf: input.cpf },
        select: { id: true },
      });

      if (cpfOwner && cpfOwner.id !== input.id) {
        throw new ConflictError("Ja existe um aluno com este CPF.");
      }
    }

    if (input.primaryModalityId) {
      await ensureActiveModality(tx, input.primaryModalityId);
    }

    if (input.responsibleTeacherId) {
      await ensureTeacherExists(tx, input.responsibleTeacherId);
    }

    await tx.user.update({
      where: { id: existing.user.id },
      data: {
        name: input.name,
        email: input.email,
        phone: normalizeOptionalString(input.phone),
        isActive: normalizeStudentUserActive(input.status),
      },
    });

    const student = await tx.studentProfile.update({
      where: { id: input.id },
      data: {
        registrationNumber:
          normalizeOptionalUppercase(input.registrationNumber) ??
          existing.registrationNumber,
        status: input.status,
        primaryModalityId: input.primaryModalityId ?? null,
        responsibleTeacherId: input.responsibleTeacherId ?? null,
        birthDate: parseDateOnly(input.birthDate) ?? null,
        cpf: input.cpf ?? null,
        city: normalizeOptionalString(input.city),
        state: normalizeOptionalUppercase(input.state),
        joinedAt: parseDateOnly(input.joinedAt) ?? undefined,
        beltLevel: normalizeOptionalString(input.beltLevel),
        weightKg: input.weightKg ?? null,
        heightCm: input.heightCm ?? null,
        goals: normalizeOptionalString(input.goals),
        notes: normalizeOptionalString(input.notes),
      },
      select: { id: true, registrationNumber: true, status: true },
    });

    if (input.status === StudentStatus.INACTIVE) {
      await tx.classEnrollment.updateMany({
        where: { studentProfileId: input.id, isActive: true },
        data: { isActive: false, endsAt: startOfDay() },
      });
    }

    return student;
  });

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: "STUDENT_UPDATED",
    entityType: "StudentProfile",
    entityId: result.id,
    summary: `Aluno ${input.name} atualizado pela operacao interna.`,
    beforeData: {
      email: existing.user.email,
      registrationNumber: existing.registrationNumber,
      status: existing.status,
    },
    afterData: {
      email: input.email,
      registrationNumber: result.registrationNumber,
      status: result.status,
    },
  });

  return result;
}

export async function deactivateStudent(
  studentProfileId: string,
  context: MutationContext,
) {
  const existing = await prisma.studentProfile.findUnique({
    where: { id: studentProfileId },
    select: {
      id: true,
      status: true,
      user: { select: { id: true, name: true } },
    },
  });

  if (!existing) {
    throw new NotFoundError("Aluno nao encontrado.");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: existing.user.id },
      data: { isActive: false },
    }),
    prisma.studentProfile.update({
      where: { id: studentProfileId },
      data: { status: StudentStatus.INACTIVE },
    }),
    prisma.classEnrollment.updateMany({
      where: { studentProfileId, isActive: true },
      data: { isActive: false, endsAt: startOfDay() },
    }),
  ]);

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: "STUDENT_DEACTIVATED",
    entityType: "StudentProfile",
    entityId: studentProfileId,
    summary: `Aluno ${existing.user.name} inativado.`,
    beforeData: { status: existing.status },
    afterData: { status: StudentStatus.INACTIVE },
  });
}
