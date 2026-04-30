import type { z } from "zod";
import { Prisma, UserRole } from "@prisma/client";
import { startOfDay } from "@/lib/academy/constants";
import {
  getModalityVisibilityWhere,
  getStudentVisibilityWhere,
  getTeacherVisibilityWhere,
  requireStudentViewerContext,
  requireTeacherViewerContext,
  type ViewerContext,
} from "@/lib/academy/access";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getTrainingTemplateVisibilityWhere } from "@/lib/training/access";
import {
  announcementFiltersSchema,
  createAnnouncementSchema,
  createTrainingAssignmentSchema,
  createTrainingTemplateSchema,
  trainingAssignmentFiltersSchema,
  trainingTemplateFiltersSchema,
  updateAnnouncementSchema,
  updateTrainingAssignmentSchema,
  updateTrainingTemplateSchema,
} from "@/lib/validators";

export type TrainingTemplateFiltersInput = z.infer<typeof trainingTemplateFiltersSchema>;
export type TrainingAssignmentFiltersInput = z.infer<typeof trainingAssignmentFiltersSchema>;
export type AnnouncementFiltersInput = z.infer<typeof announcementFiltersSchema>;
export type CreateTrainingTemplateInput = z.infer<typeof createTrainingTemplateSchema>;
export type UpdateTrainingTemplateInput = z.infer<typeof updateTrainingTemplateSchema>;
export type CreateTrainingAssignmentInput = z.infer<typeof createTrainingAssignmentSchema>;
export type UpdateTrainingAssignmentInput = z.infer<typeof updateTrainingAssignmentSchema>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

export type MutationContext = {
  viewer: ViewerContext;
  request?: Request;
};

export function parseDateOnly(value?: string | Date | null) {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date) {
    return startOfDay(value);
  }
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function normalizeOptionalString(value?: string | null) {
  return value?.trim() || null;
}

export function normalizeLevel(value?: string | null) {
  return value?.trim() || null;
}

export async function ensureTeacherProfileVisible(
  viewer: ViewerContext,
  teacherProfileId: string,
) {
  const teacher = await prisma.teacherProfile.findFirst({
    where: {
      AND: [
        getTeacherVisibilityWhere(viewer),
        { id: teacherProfileId, isActive: true, user: { isActive: true } },
      ],
    },
    select: { id: true, user: { select: { name: true } } },
  });

  if (!teacher) {
    throw new NotFoundError("Professor nao encontrado ou indisponivel.");
  }

  return teacher;
}

export async function ensureModalityVisible(
  viewer: ViewerContext,
  modalityId: string,
) {
  const modality = await prisma.modality.findFirst({
    where: {
      AND: [getModalityVisibilityWhere(viewer), { id: modalityId, isActive: true }],
    },
    select: { id: true, name: true },
  });

  if (!modality) {
    throw new NotFoundError("Modalidade nao encontrada ou indisponivel.");
  }

  return modality;
}

export async function ensureVisibleStudentsForAssignments(
  viewer: ViewerContext,
  studentIds: string[],
) {
  const students = await prisma.studentProfile.findMany({
    where: {
      AND: [
        getStudentVisibilityWhere(viewer),
        { id: { in: studentIds }, user: { isActive: true } },
      ],
    },
    select: {
      id: true,
      registrationNumber: true,
      user: { select: { name: true } },
    },
  });

  if (students.length !== studentIds.length) {
    throw new ConflictError(
      "Um ou mais alunos selecionados nao estao disponiveis para este professor.",
    );
  }

  return students;
}

export async function generateUniqueTemplateSlug(baseSlug: string, templateId?: string) {
  let currentSlug = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.trainingTemplate.findFirst({
      where: {
        slug: currentSlug,
        ...(templateId ? { id: { not: templateId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return currentSlug;
    }

    currentSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export function assertCanManageTemplate(
  viewer: ViewerContext,
  template: { teacherProfileId: string | null },
) {
  if (viewer.role === UserRole.ADMIN) {
    return;
  }

  const teacherProfileId = requireTeacherViewerContext(viewer);

  if (template.teacherProfileId && template.teacherProfileId !== teacherProfileId) {
    throw new ForbiddenError("Voce so pode editar modelos de treino vinculados ao seu perfil.");
  }
}

export function assertCanManageAnnouncement(
  viewer: ViewerContext,
  announcement: { createdByUserId: string },
) {
  if (viewer.role === UserRole.ADMIN || viewer.role === UserRole.RECEPCAO) {
    return;
  }

  if (announcement.createdByUserId !== viewer.userId) {
    throw new ForbiddenError("Voce so pode gerenciar avisos criados pela sua conta.");
  }
}

export function resolveTemplateTeacherProfileId(
  input: { teacherProfileId?: string | null },
  context: MutationContext,
) {
  if (context.viewer.role === UserRole.PROFESSOR) {
    return requireTeacherViewerContext(context.viewer);
  }
  return input.teacherProfileId ?? null;
}

export function resolveAssignmentTeacherProfileId(
  input: { teacherProfileId?: string | null },
  context: MutationContext,
) {
  if (context.viewer.role === UserRole.PROFESSOR) {
    return requireTeacherViewerContext(context.viewer);
  }
  return input.teacherProfileId ?? null;
}

export async function getTrainingLevels(viewer: ViewerContext) {
  const templates = await prisma.trainingTemplate.findMany({
    where: getTrainingTemplateVisibilityWhere(viewer),
    distinct: ["level"],
    orderBy: { level: "asc" },
    select: { level: true },
  });

  return templates
    .map((template) => template.level)
    .filter((level): level is string => Boolean(level));
}

export async function generateUniqueAnnouncementSlug(
  baseSlug: string,
  announcementId?: string,
) {
  let currentSlug = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.announcement.findFirst({
      where: {
        slug: currentSlug,
        ...(announcementId ? { id: { not: announcementId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return currentSlug;
    }

    currentSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export function getClassScheduleDays(schedule: {
  dayOfWeek: number;
  daysOfWeek: number[];
}) {
  return schedule.daysOfWeek.length > 0 ? schedule.daysOfWeek : [schedule.dayOfWeek];
}

export function buildNextClassOccurrence(
  schedule: {
    dayOfWeek: number;
    daysOfWeek: number[];
    startTime: string;
  },
  referenceDate = new Date(),
) {
  const [hours, minutes] = schedule.startTime.split(":").map(Number);
  const weekdays = getClassScheduleDays(schedule);
  let nextOccurrence: Date | null = null;

  for (const weekday of weekdays) {
    const candidate = new Date(referenceDate);
    const offset = (weekday - candidate.getDay() + 7) % 7;
    candidate.setDate(candidate.getDate() + offset);
    candidate.setHours(hours, minutes, 0, 0);

    if (candidate < referenceDate) {
      candidate.setDate(candidate.getDate() + 7);
    }

    if (!nextOccurrence || candidate < nextOccurrence) {
      nextOccurrence = candidate;
    }
  }

  return nextOccurrence;
}

export function buildPublishedAnnouncementWhere(referenceDate = new Date()) {
  return {
    isPublished: true,
    OR: [{ publishedAt: null }, { publishedAt: { lte: referenceDate } }],
    AND: [
      {
        OR: [{ expiresAt: null }, { expiresAt: { gt: referenceDate } }],
      },
    ],
  } satisfies Prisma.AnnouncementWhereInput;
}

export async function getStudentAnnouncementTeacherIds(viewer: ViewerContext) {
  const studentProfileId = requireStudentViewerContext(viewer);
  const student = await prisma.studentProfile.findFirst({
    where: {
      AND: [getStudentVisibilityWhere(viewer), { id: studentProfileId }],
    },
    select: {
      responsibleTeacherId: true,
      enrollments: {
        where: { isActive: true, classSchedule: { isActive: true } },
        select: { classSchedule: { select: { teacherProfileId: true } } },
      },
    },
  });

  if (!student) {
    return [];
  }

  const teacherIds = new Set<string>();

  if (student.responsibleTeacherId) {
    teacherIds.add(student.responsibleTeacherId);
  }

  for (const enrollment of student.enrollments) {
    teacherIds.add(enrollment.classSchedule.teacherProfileId);
  }

  return Array.from(teacherIds);
}

export function mergeAnnouncementsById<
  TAnnouncement extends {
    id: string;
    isPinned: boolean;
    publishedAt: Date | null;
    createdAt: Date;
  },
>(announcements: TAnnouncement[]) {
  return Array.from(
    new Map(announcements.map((announcement) => [announcement.id, announcement])).values(),
  ).sort((left, right) => {
    if (left.isPinned !== right.isPinned) {
      return Number(right.isPinned) - Number(left.isPinned);
    }

    const leftDate = left.publishedAt ?? left.createdAt;
    const rightDate = right.publishedAt ?? right.createdAt;
    return rightDate.getTime() - leftDate.getTime();
  });
}

export function isAnnouncementVisibleToStudent(
  announcement: {
    targetRole: UserRole | null;
    createdByUser: {
      role: UserRole;
      teacherProfile: { id: string } | null;
    };
  },
  teacherIds: string[],
) {
  if (
    announcement.targetRole !== null &&
    announcement.targetRole !== UserRole.ALUNO
  ) {
    return false;
  }

  if (
    announcement.createdByUser.role === UserRole.ADMIN ||
    announcement.createdByUser.role === UserRole.RECEPCAO
  ) {
    return true;
  }

  const teacherProfileId = announcement.createdByUser.teacherProfile?.id;
  return Boolean(teacherProfileId && teacherIds.includes(teacherProfileId));
}

const announcementSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  targetRole: true,
  isPinned: true,
  isPublished: true,
  publishedAt: true,
  expiresAt: true,
  createdAt: true,
  createdByUserId: true,
  createdByUser: {
    select: {
      id: true,
      name: true,
      role: true,
      teacherProfile: { select: { id: true } },
    },
  },
} as const;

export async function getVisiblePublishedAnnouncements(
  viewer: ViewerContext,
  input?: {
    search?: string;
    targetRole?: UserRole;
    take?: number;
  },
) {
  const baseWhere: Prisma.AnnouncementWhereInput = {
    AND: [
      buildPublishedAnnouncementWhere(),
      input?.search
        ? {
            OR: [
              { title: { contains: input.search, mode: "insensitive" } },
              { excerpt: { contains: input.search, mode: "insensitive" } },
              { content: { contains: input.search, mode: "insensitive" } },
            ],
          }
        : {},
    ],
  };

  if (viewer.role === UserRole.ADMIN || viewer.role === UserRole.RECEPCAO) {
    return prisma.announcement.findMany({
      where: {
        AND: [baseWhere, input?.targetRole ? { targetRole: input.targetRole } : {}],
      },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      take: input?.take,
      select: announcementSelect,
    });
  }

  if (viewer.role === UserRole.PROFESSOR) {
    return prisma.announcement.findMany({
      where: {
        AND: [
          baseWhere,
          { OR: [{ targetRole: null }, { targetRole: UserRole.PROFESSOR }] },
        ],
      },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      take: input?.take,
      select: announcementSelect,
    });
  }

  const teacherIds = await getStudentAnnouncementTeacherIds(viewer);
  const announcements = await prisma.announcement.findMany({
    where: {
      AND: [
        baseWhere,
        { OR: [{ targetRole: null }, { targetRole: UserRole.ALUNO }] },
      ],
    },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    take: input?.take ? input.take * 2 : undefined,
    select: announcementSelect,
  });

  return announcements
    .filter((announcement) => isAnnouncementVisibleToStudent(announcement, teacherIds))
    .slice(0, input?.take);
}
