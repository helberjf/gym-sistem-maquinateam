import { Prisma, UserRole } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { logAuditEvent } from "@/lib/audit";
import { buildRegistrationNumber } from "@/lib/academy/constants";
import {
  getTeacherVisibilityWhere,
  type ViewerContext,
} from "@/lib/academy/access";
import { NotFoundError, ConflictError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { buildOffsetPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import {
  type TeacherFiltersInput,
  type CreateTeacherInput,
  type UpdateTeacherInput,
  type MutationContext,
  parseDateOnly,
  normalizeOptionalString,
  normalizeOptionalUppercase,
  getTeacherOptions,
} from "@/lib/academy/utils";

export async function getTeachersIndexData(
  viewer: ViewerContext,
  filters: TeacherFiltersInput,
) {
  const where: Prisma.TeacherProfileWhereInput = {
    AND: [
      getTeacherVisibilityWhere(viewer),
      filters.search
        ? {
            OR: [
              { user: { name: { contains: filters.search, mode: "insensitive" } } },
              { user: { email: { contains: filters.search, mode: "insensitive" } } },
            ],
          }
        : {},
      filters.modalityId
        ? { modalities: { some: { id: filters.modalityId } } }
        : {},
      filters.onlyInactive === true
        ? { OR: [{ isActive: false }, { user: { isActive: false } }] }
        : filters.onlyInactive === false
          ? { isActive: true, user: { isActive: true } }
          : {},
    ],
  };

  const [totalTeachers, options] = await Promise.all([
    prisma.teacherProfile.count({ where }),
    getTeacherOptions(viewer),
  ]);
  const pagination = buildOffsetPagination({ page: filters.page, totalItems: totalTeachers });
  const teachers = await prisma.teacherProfile.findMany({
    where,
    orderBy: { user: { name: "asc" } },
    skip: pagination.skip,
    take: pagination.limit,
    select: {
      id: true,
      registrationNumber: true,
      specialties: true,
      experienceYears: true,
      isActive: true,
      user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
      modalities: {
        select: { id: true, name: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
      _count: { select: { classes: true, responsibleStudents: true } },
    },
  });

  return {
    teachers,
    pagination,
    options,
    canManage: hasPermission(viewer.role, "manageTeachers"),
  };
}

export async function getTeacherDetailData(
  viewer: ViewerContext,
  teacherProfileId: string,
) {
  const teacher = await prisma.teacherProfile.findFirst({
    where: { AND: [getTeacherVisibilityWhere(viewer), { id: teacherProfileId }] },
    select: {
      id: true,
      registrationNumber: true,
      cpf: true,
      specialties: true,
      experienceYears: true,
      hireDate: true,
      beltLevel: true,
      notes: true,
      bio: true,
      isActive: true,
      user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
      modalities: {
        select: { id: true, name: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
      classes: {
        orderBy: [{ isActive: "desc" }, { startTime: "asc" }],
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          dayOfWeek: true,
          daysOfWeek: true,
          isActive: true,
          modality: { select: { name: true } },
          _count: { select: { enrollments: true } },
        },
      },
      responsibleStudents: {
        take: 8,
        orderBy: { joinedAt: "desc" },
        select: {
          id: true,
          registrationNumber: true,
          status: true,
          user: { select: { name: true } },
        },
      },
    },
  });

  if (!teacher) {
    throw new NotFoundError("Professor nao encontrado ou indisponivel.");
  }

  return {
    teacher,
    options: await getTeacherOptions(viewer),
    canManage: hasPermission(viewer.role, "manageTeachers"),
  };
}

export async function createTeacher(
  input: CreateTeacherInput,
  context: MutationContext,
) {
  const passwordHash = await hashPassword(input.password);

  const result = await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictError("Ja existe um usuario com este e-mail.");
    }

    if (input.cpf) {
      const existingCpf = await tx.teacherProfile.findUnique({
        where: { cpf: input.cpf },
        select: { id: true },
      });

      if (existingCpf) {
        throw new ConflictError("Ja existe um professor com este CPF.");
      }
    }

    const validModalities = await tx.modality.findMany({
      where: { id: { in: input.modalityIds }, isActive: true },
      select: { id: true },
    });

    if (validModalities.length !== input.modalityIds.length) {
      throw new ConflictError("Selecione apenas modalidades ativas para o professor.");
    }

    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: normalizeOptionalString(input.phone),
        role: UserRole.PROFESSOR,
        isActive: input.isActive ?? true,
        emailVerified: new Date(),
        passwordHash,
      },
      select: { id: true, name: true, email: true },
    });

    const teacher = await tx.teacherProfile.create({
      data: {
        userId: user.id,
        registrationNumber:
          normalizeOptionalUppercase(input.registrationNumber) ??
          buildRegistrationNumber("PROF", user.id),
        cpf: input.cpf ?? null,
        specialties: normalizeOptionalString(input.specialties),
        bio: normalizeOptionalString(input.notes),
        experienceYears: input.experienceYears ?? null,
        hireDate: parseDateOnly(input.hireDate),
        beltLevel: normalizeOptionalString(input.beltLevel),
        notes: normalizeOptionalString(input.notes),
        isActive: input.isActive ?? true,
        modalities: { connect: input.modalityIds.map((id) => ({ id })) },
      },
      select: { id: true, registrationNumber: true },
    });

    return { user, teacher };
  });

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: "TEACHER_CREATED",
    entityType: "TeacherProfile",
    entityId: result.teacher.id,
    summary: `Professor ${result.user.name} criado pela operacao interna.`,
    afterData: {
      email: result.user.email,
      registrationNumber: result.teacher.registrationNumber,
    },
  });

  return result;
}

export async function updateTeacher(
  input: UpdateTeacherInput,
  context: MutationContext,
) {
  const existing = await prisma.teacherProfile.findUnique({
    where: { id: input.id },
    select: {
      id: true,
      registrationNumber: true,
      isActive: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!existing) {
    throw new NotFoundError("Professor nao encontrado.");
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
      const cpfOwner = await tx.teacherProfile.findUnique({
        where: { cpf: input.cpf },
        select: { id: true },
      });

      if (cpfOwner && cpfOwner.id !== input.id) {
        throw new ConflictError("Ja existe um professor com este CPF.");
      }
    }

    if (input.isActive === false) {
      const activeClasses = await tx.classSchedule.count({
        where: { teacherProfileId: input.id, isActive: true },
      });

      if (activeClasses > 0) {
        throw new ConflictError(
          "Reatribua ou inative as turmas deste professor antes de inativa-lo.",
        );
      }
    }

    const validModalities = await tx.modality.findMany({
      where: { id: { in: input.modalityIds }, isActive: true },
      select: { id: true },
    });

    if (validModalities.length !== input.modalityIds.length) {
      throw new ConflictError("Selecione apenas modalidades ativas para o professor.");
    }

    await tx.user.update({
      where: { id: existing.user.id },
      data: {
        name: input.name,
        email: input.email,
        phone: normalizeOptionalString(input.phone),
        isActive: input.isActive ?? true,
      },
    });

    const teacher = await tx.teacherProfile.update({
      where: { id: input.id },
      data: {
        registrationNumber:
          normalizeOptionalUppercase(input.registrationNumber) ??
          existing.registrationNumber,
        cpf: input.cpf ?? null,
        specialties: normalizeOptionalString(input.specialties),
        bio: normalizeOptionalString(input.notes),
        experienceYears: input.experienceYears ?? null,
        hireDate: parseDateOnly(input.hireDate) ?? null,
        beltLevel: normalizeOptionalString(input.beltLevel),
        notes: normalizeOptionalString(input.notes),
        isActive: input.isActive ?? true,
        modalities: { set: input.modalityIds.map((id) => ({ id })) },
      },
      select: { id: true, registrationNumber: true, isActive: true },
    });

    return teacher;
  });

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: "TEACHER_UPDATED",
    entityType: "TeacherProfile",
    entityId: result.id,
    summary: `Professor ${input.name} atualizado pela operacao interna.`,
    beforeData: {
      email: existing.user.email,
      registrationNumber: existing.registrationNumber,
      isActive: existing.isActive,
    },
    afterData: {
      email: input.email,
      registrationNumber: result.registrationNumber,
      isActive: result.isActive,
    },
  });

  return result;
}

export async function deactivateTeacher(
  teacherProfileId: string,
  context: MutationContext,
) {
  const existing = await prisma.teacherProfile.findUnique({
    where: { id: teacherProfileId },
    select: {
      id: true,
      isActive: true,
      user: { select: { id: true, name: true } },
    },
  });

  if (!existing) {
    throw new NotFoundError("Professor nao encontrado.");
  }

  const activeClasses = await prisma.classSchedule.count({
    where: { teacherProfileId, isActive: true },
  });

  if (activeClasses > 0) {
    throw new ConflictError(
      "Reatribua ou inative as turmas deste professor antes de inativa-lo.",
    );
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: existing.user.id }, data: { isActive: false } }),
    prisma.teacherProfile.update({ where: { id: teacherProfileId }, data: { isActive: false } }),
  ]);

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: "TEACHER_DEACTIVATED",
    entityType: "TeacherProfile",
    entityId: teacherProfileId,
    summary: `Professor ${existing.user.name} inativado.`,
    beforeData: { isActive: existing.isActive },
    afterData: { isActive: false },
  });
}
