import type { z } from "zod";
import { AttendanceStatus, Prisma, StudentStatus } from "@prisma/client";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { startOfDay } from "@/lib/academy/constants";
import { prisma } from "@/lib/prisma";
import { type ViewerContext } from "@/lib/academy/access";
import {
  attendanceFiltersSchema,
  checkInSchema,
  checkOutSchema,
  classScheduleFiltersSchema,
  createClassScheduleSchema,
  createModalitySchema,
  createStudentSchema,
  createTeacherSchema,
  modalityFiltersSchema,
  studentFiltersSchema,
  teacherFiltersSchema,
  updateClassScheduleSchema,
  updateModalitySchema,
  updateStudentSchema,
  updateTeacherSchema,
} from "@/lib/validators";

export type StudentFiltersInput = z.infer<typeof studentFiltersSchema>;
export type TeacherFiltersInput = z.infer<typeof teacherFiltersSchema>;
export type ModalityFiltersInput = z.infer<typeof modalityFiltersSchema>;
export type ClassScheduleFiltersInput = z.infer<typeof classScheduleFiltersSchema>;
export type AttendanceFiltersInput = z.infer<typeof attendanceFiltersSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
export type CreateModalityInput = z.infer<typeof createModalitySchema>;
export type UpdateModalityInput = z.infer<typeof updateModalitySchema>;
export type CreateClassScheduleInput = z.infer<typeof createClassScheduleSchema>;
export type UpdateClassScheduleInput = z.infer<typeof updateClassScheduleSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;

export type MutationContext = {
  viewer: ViewerContext;
  request?: Request;
};

export function parseDateOnly(value?: string) {
  if (!value) {
    return undefined;
  }
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function normalizeOptionalString(value?: string | null) {
  return value?.trim() || null;
}

export function normalizeOptionalUppercase(value?: string | null) {
  return value?.trim().toUpperCase() || null;
}

export function normalizeStudentUserActive(status: StudentStatus) {
  return status !== StudentStatus.INACTIVE;
}

export async function ensureActiveModality(
  tx: Prisma.TransactionClient,
  modalityId: string,
) {
  const modality = await tx.modality.findUnique({
    where: { id: modalityId },
    select: { id: true, name: true, isActive: true },
  });

  if (!modality) {
    throw new NotFoundError("Modalidade nao encontrada.");
  }

  if (!modality.isActive) {
    throw new ConflictError("Selecione uma modalidade ativa.");
  }

  return modality;
}

export async function ensureTeacherExists(
  tx: Prisma.TransactionClient,
  teacherProfileId: string,
) {
  const teacher = await tx.teacherProfile.findUnique({
    where: { id: teacherProfileId },
    select: {
      id: true,
      isActive: true,
      user: { select: { id: true, name: true, isActive: true } },
      modalities: { select: { id: true } },
    },
  });

  if (!teacher) {
    throw new NotFoundError("Professor nao encontrado.");
  }

  if (!teacher.isActive || !teacher.user.isActive) {
    throw new ConflictError("Selecione um professor ativo.");
  }

  return teacher;
}

export async function ensureStudentsAvailable(
  tx: Prisma.TransactionClient,
  studentIds: string[],
) {
  if (studentIds.length === 0) {
    return [];
  }

  const students = await tx.studentProfile.findMany({
    where: {
      id: { in: studentIds },
      user: { isActive: true },
      status: { not: StudentStatus.INACTIVE },
    },
    select: {
      id: true,
      registrationNumber: true,
      status: true,
      user: { select: { name: true } },
    },
  });

  if (students.length !== studentIds.length) {
    throw new ConflictError(
      "Um ou mais alunos selecionados nao estao ativos para matricula.",
    );
  }

  return students;
}

export async function ensureTeacherTeachesModality(
  tx: Prisma.TransactionClient,
  teacherProfileId: string,
  modalityId: string,
) {
  const teacher = await ensureTeacherExists(tx, teacherProfileId);
  const teachesModality = teacher.modalities.some((m) => m.id === modalityId);

  if (!teachesModality) {
    throw new ConflictError(
      "O professor selecionado ainda nao esta vinculado a esta modalidade.",
    );
  }

  return teacher;
}

export async function getStudentOptions(viewer: ViewerContext) {
  if (!hasPermission(viewer.role, "manageStudents")) {
    return null;
  }

  const [modalities, teachers] = await prisma.$transaction([
    prisma.modality.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.teacherProfile.findMany({
      where: { isActive: true, user: { isActive: true } },
      orderBy: { user: { name: "asc" } },
      select: { id: true, user: { select: { name: true } } },
    }),
  ]);

  return { modalities, teachers };
}

export async function getTeacherOptions(viewer: ViewerContext) {
  if (!hasPermission(viewer.role, "manageTeachers")) {
    return null;
  }

  const modalities = await prisma.modality.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  return { modalities };
}

export async function getClassScheduleOptions(viewer: ViewerContext) {
  if (!hasPermission(viewer.role, "manageClassSchedules")) {
    return null;
  }

  const [modalities, teachers, students] = await prisma.$transaction([
    prisma.modality.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.teacherProfile.findMany({
      where: { isActive: true, user: { isActive: true } },
      orderBy: { user: { name: "asc" } },
      select: {
        id: true,
        user: { select: { name: true } },
        modalities: { select: { id: true } },
      },
    }),
    prisma.studentProfile.findMany({
      where: { user: { isActive: true }, status: { not: StudentStatus.INACTIVE } },
      orderBy: { user: { name: "asc" } },
      select: {
        id: true,
        registrationNumber: true,
        user: { select: { name: true } },
      },
    }),
  ]);

  return { modalities, teachers, students };
}

export function buildDateRangeWhere(filters: AttendanceFiltersInput) {
  if (!filters.dateFrom && !filters.dateTo) {
    return undefined;
  }

  return {
    classDate: {
      ...(filters.dateFrom ? { gte: parseDateOnly(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: parseDateOnly(filters.dateTo) } : {}),
    },
  } satisfies Prisma.AttendanceWhereInput;
}

export async function syncScheduleEnrollments(params: {
  tx: Prisma.TransactionClient;
  classScheduleId: string;
  modalityId: string;
  studentIds: string[];
  actorId: string;
}) {
  const existing = await params.tx.classEnrollment.findMany({
    where: { classScheduleId: params.classScheduleId },
    select: { id: true, studentProfileId: true, isActive: true },
  });

  const desiredIds = new Set(params.studentIds);
  const existingByStudentId = new Map(
    existing.map((record) => [record.studentProfileId, record]),
  );

  for (const studentId of params.studentIds) {
    const current = existingByStudentId.get(studentId);

    if (!current) {
      await params.tx.classEnrollment.create({
        data: {
          studentProfileId: studentId,
          classScheduleId: params.classScheduleId,
          modalityId: params.modalityId,
          createdByUserId: params.actorId,
          startsAt: startOfDay(),
          isActive: true,
        },
      });
      continue;
    }

    if (!current.isActive) {
      await params.tx.classEnrollment.update({
        where: { id: current.id },
        data: {
          isActive: true,
          startsAt: startOfDay(),
          endsAt: null,
          modalityId: params.modalityId,
        },
      });
    } else {
      await params.tx.classEnrollment.update({
        where: { id: current.id },
        data: { modalityId: params.modalityId },
      });
    }
  }

  const removableIds = existing
    .filter((record) => record.isActive && !desiredIds.has(record.studentProfileId))
    .map((record) => record.id);

  if (removableIds.length > 0) {
    await params.tx.classEnrollment.updateMany({
      where: { id: { in: removableIds } },
      data: { isActive: false, endsAt: startOfDay() },
    });
  }
}
