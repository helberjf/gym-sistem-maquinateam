import { Prisma, TrainingAssignmentStatus, UserRole } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";
import { slugify } from "@/lib/academy/constants";
import {
  getModalityVisibilityWhere,
  getStudentVisibilityWhere,
  getTeacherVisibilityWhere,
  requireTeacherViewerContext,
  type ViewerContext,
} from "@/lib/academy/access";
import { NotFoundError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  buildTrainingStructure,
  countFilledTrainingBlocks,
  extractTrainingStructure,
} from "@/lib/training/constants";
import {
  ensureVisibleTrainingTemplate,
  getTrainingAssignmentVisibilityWhere,
  getTrainingTemplateVisibilityWhere,
} from "@/lib/training/access";
import {
  type TrainingTemplateFiltersInput,
  type TrainingAssignmentFiltersInput,
  type CreateTrainingTemplateInput,
  type UpdateTrainingTemplateInput,
  type MutationContext,
  normalizeOptionalString,
  normalizeLevel,
  ensureTeacherProfileVisible,
  ensureModalityVisible,
  generateUniqueTemplateSlug,
  assertCanManageTemplate,
  resolveTemplateTeacherProfileId,
  getTrainingLevels,
} from "@/lib/training/utils";

export async function getTrainingOptions(viewer: ViewerContext) {
  const [modalities, levels] = await Promise.all([
    prisma.modality.findMany({
      where: { AND: [getModalityVisibilityWhere(viewer), { isActive: true }] },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    getTrainingLevels(viewer),
  ]);

  if (!hasPermission(viewer.role, "manageTrainings")) {
    return { modalities, levels, templates: [], students: [], teachers: [] };
  }

  const [templates, students, teachers] = await Promise.all([
    prisma.trainingTemplate.findMany({
      where: { AND: [getTrainingTemplateVisibilityWhere(viewer), { isActive: true }] },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        level: true,
        modality: { select: { name: true } },
      },
    }),
    prisma.studentProfile.findMany({
      where: {
        AND: [getStudentVisibilityWhere(viewer), { user: { isActive: true } }],
      },
      orderBy: { user: { name: "asc" } },
      select: {
        id: true,
        registrationNumber: true,
        user: { select: { name: true } },
      },
    }),
    prisma.teacherProfile.findMany({
      where: { AND: [getTeacherVisibilityWhere(viewer), { isActive: true }] },
      orderBy: { user: { name: "asc" } },
      select: { id: true, user: { select: { name: true } } },
    }),
  ]);

  return { modalities, levels, templates, students, teachers };
}

export async function getTrainingHubData(
  viewer: ViewerContext,
  filters: {
    templateFilters: TrainingTemplateFiltersInput;
    assignmentFilters: TrainingAssignmentFiltersInput;
  },
) {
  const canManage = hasPermission(viewer.role, "manageTrainings");

  const templateWhere: Prisma.TrainingTemplateWhereInput = {
    AND: [
      getTrainingTemplateVisibilityWhere(viewer),
      filters.templateFilters.search
        ? {
            OR: [
              { name: { contains: filters.templateFilters.search, mode: "insensitive" } },
              { description: { contains: filters.templateFilters.search, mode: "insensitive" } },
              { objective: { contains: filters.templateFilters.search, mode: "insensitive" } },
            ],
          }
        : {},
      filters.templateFilters.modalityId
        ? { modalityId: filters.templateFilters.modalityId }
        : {},
      filters.templateFilters.level
        ? { level: { contains: filters.templateFilters.level, mode: "insensitive" } }
        : {},
      filters.templateFilters.onlyInactive ? { isActive: false } : {},
    ],
  };

  const assignmentWhere: Prisma.TrainingAssignmentWhereInput = {
    AND: [
      getTrainingAssignmentVisibilityWhere(viewer),
      filters.assignmentFilters.search
        ? {
            OR: [
              { title: { contains: filters.assignmentFilters.search, mode: "insensitive" } },
              { instructions: { contains: filters.assignmentFilters.search, mode: "insensitive" } },
              {
                studentProfile: {
                  is: { user: { name: { contains: filters.assignmentFilters.search, mode: "insensitive" } } },
                },
              },
              {
                trainingTemplate: {
                  is: { name: { contains: filters.assignmentFilters.search, mode: "insensitive" } },
                },
              },
            ],
          }
        : {},
      filters.assignmentFilters.studentId
        ? { studentProfileId: filters.assignmentFilters.studentId }
        : {},
      filters.assignmentFilters.teacherId
        ? { teacherProfileId: filters.assignmentFilters.teacherId }
        : {},
      filters.assignmentFilters.status ? { status: filters.assignmentFilters.status } : {},
      filters.assignmentFilters.modalityId
        ? { trainingTemplate: { is: { modalityId: filters.assignmentFilters.modalityId } } }
        : {},
      filters.assignmentFilters.level
        ? {
            trainingTemplate: {
              is: {
                level: { contains: filters.assignmentFilters.level, mode: "insensitive" },
              },
            },
          }
        : {},
    ],
  };

  const [templates, assignments, options] = await Promise.all([
    canManage
      ? prisma.trainingTemplate.findMany({
          where: templateWhere,
          orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
          take: 12,
          select: {
            id: true,
            name: true,
            slug: true,
            level: true,
            description: true,
            objective: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            modality: { select: { id: true, name: true } },
            teacherProfile: { select: { id: true, user: { select: { name: true } } } },
            content: true,
            _count: { select: { assignments: true } },
          },
        })
      : Promise.resolve([]),
    prisma.trainingAssignment.findMany({
      where: assignmentWhere,
      orderBy: [{ assignedAt: "desc" }, { createdAt: "desc" }],
      take: canManage ? 20 : 24,
      select: {
        id: true,
        title: true,
        status: true,
        assignedAt: true,
        dueAt: true,
        completedAt: true,
        instructions: true,
        studentNotes: true,
        feedback: true,
        studentProfile: {
          select: {
            id: true,
            registrationNumber: true,
            user: { select: { name: true } },
          },
        },
        teacherProfile: { select: { id: true, user: { select: { name: true } } } },
        trainingTemplate: {
          select: {
            id: true,
            name: true,
            level: true,
            objective: true,
            modality: { select: { id: true, name: true } },
          },
        },
        content: true,
      },
    }),
    getTrainingOptions(viewer),
  ]);

  const summary = {
    templateCount: templates.length,
    activeTemplateCount: templates.filter((template) => template.isActive).length,
    assignedCount: assignments.filter(
      (assignment) =>
        assignment.status === TrainingAssignmentStatus.ASSIGNED ||
        assignment.status === TrainingAssignmentStatus.IN_PROGRESS,
    ).length,
    completedCount: assignments.filter(
      (assignment) => assignment.status === TrainingAssignmentStatus.COMPLETED,
    ).length,
  };

  return {
    templates,
    assignments,
    activeAssignments: assignments.filter(
      (assignment) =>
        assignment.status === TrainingAssignmentStatus.ASSIGNED ||
        assignment.status === TrainingAssignmentStatus.IN_PROGRESS,
    ),
    historyAssignments: assignments.filter(
      (assignment) =>
        assignment.status === TrainingAssignmentStatus.COMPLETED ||
        assignment.status === TrainingAssignmentStatus.MISSED ||
        assignment.status === TrainingAssignmentStatus.CANCELLED,
    ),
    summary,
    options,
    canManage,
  };
}

export async function getTrainingTemplateDetailData(
  viewer: ViewerContext,
  templateId: string,
) {
  await ensureVisibleTrainingTemplate(viewer, templateId);

  const template = await prisma.trainingTemplate.findFirst({
    where: { AND: [getTrainingTemplateVisibilityWhere(viewer), { id: templateId }] },
    select: {
      id: true,
      name: true,
      slug: true,
      level: true,
      description: true,
      objective: true,
      durationMinutes: true,
      isActive: true,
      updatedAt: true,
      teacherProfileId: true,
      content: true,
      modality: { select: { id: true, name: true } },
      teacherProfile: { select: { id: true, user: { select: { name: true } } } },
      assignments: {
        where: getTrainingAssignmentVisibilityWhere(viewer),
        orderBy: [{ assignedAt: "desc" }],
        take: 8,
        select: {
          id: true,
          title: true,
          status: true,
          assignedAt: true,
          dueAt: true,
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

  if (!template) {
    throw new NotFoundError("Modelo de treino nao encontrado.");
  }

  return {
    template,
    structure: extractTrainingStructure(template.content),
    options: await getTrainingOptions(viewer),
    canManage: hasPermission(viewer.role, "manageTrainings"),
  };
}

export async function createTrainingTemplate(
  input: CreateTrainingTemplateInput,
  context: MutationContext,
) {
  const teacherProfileId = resolveTemplateTeacherProfileId(input, context);

  await ensureModalityVisible(context.viewer, input.modalityId);

  if (teacherProfileId) {
    await ensureTeacherProfileVisible(context.viewer, teacherProfileId);
  }

  const slug = await generateUniqueTemplateSlug(slugify(input.slug ?? input.name));
  const content = buildTrainingStructure(input);

  const template = await prisma.trainingTemplate.create({
    data: {
      name: input.name,
      slug,
      modalityId: input.modalityId,
      teacherProfileId,
      level: normalizeLevel(input.level),
      description: normalizeOptionalString(input.description),
      objective: normalizeOptionalString(input.objective),
      durationMinutes: input.durationMinutes ?? null,
      content,
      isActive: input.isActive ?? true,
    },
    select: { id: true, name: true, slug: true, level: true },
  });

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: "TRAINING_TEMPLATE_CREATED",
    entityType: "TrainingTemplate",
    entityId: template.id,
    summary: `Modelo de treino ${template.name} criado.`,
    afterData: {
      slug: template.slug,
      level: template.level,
      modalityId: input.modalityId,
      teacherProfileId,
      blocks: countFilledTrainingBlocks(content),
    },
  });

  return template;
}

export async function updateTrainingTemplate(
  input: UpdateTrainingTemplateInput,
  context: MutationContext,
) {
  const existing = await prisma.trainingTemplate.findUnique({
    where: { id: input.id },
    select: {
      id: true,
      name: true,
      slug: true,
      teacherProfileId: true,
      modalityId: true,
      level: true,
      objective: true,
      description: true,
      durationMinutes: true,
      content: true,
      isActive: true,
    },
  });

  if (!existing) {
    throw new NotFoundError("Modelo de treino nao encontrado.");
  }

  assertCanManageTemplate(context.viewer, existing);
  await ensureModalityVisible(context.viewer, input.modalityId);

  const teacherProfileId = resolveTemplateTeacherProfileId(input, context);

  if (teacherProfileId) {
    await ensureTeacherProfileVisible(context.viewer, teacherProfileId);
  }

  const slug = await generateUniqueTemplateSlug(slugify(input.slug ?? input.name), input.id);
  const content = buildTrainingStructure(input);

  const template = await prisma.trainingTemplate.update({
    where: { id: input.id },
    data: {
      name: input.name,
      slug,
      modalityId: input.modalityId,
      teacherProfileId,
      level: normalizeLevel(input.level),
      description: normalizeOptionalString(input.description),
      objective: normalizeOptionalString(input.objective),
      durationMinutes: input.durationMinutes ?? null,
      content,
      isActive: input.isActive ?? true,
    },
    select: { id: true, name: true, slug: true, level: true },
  });

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: "TRAINING_TEMPLATE_UPDATED",
    entityType: "TrainingTemplate",
    entityId: template.id,
    summary: `Modelo de treino ${template.name} atualizado.`,
    beforeData: existing,
    afterData: {
      slug: template.slug,
      level: template.level,
      modalityId: input.modalityId,
      teacherProfileId,
      blocks: countFilledTrainingBlocks(content),
      isActive: input.isActive ?? true,
    },
  });

  return template;
}

export async function archiveTrainingTemplate(
  templateId: string,
  context: MutationContext,
) {
  const existing = await prisma.trainingTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, name: true, teacherProfileId: true, isActive: true },
  });

  if (!existing) {
    throw new NotFoundError("Modelo de treino nao encontrado.");
  }

  assertCanManageTemplate(context.viewer, existing);

  await prisma.trainingTemplate.update({
    where: { id: templateId },
    data: { isActive: false },
  });

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: "TRAINING_TEMPLATE_ARCHIVED",
    entityType: "TrainingTemplate",
    entityId: existing.id,
    summary: `Modelo de treino ${existing.name} arquivado.`,
    beforeData: existing,
    afterData: { isActive: false },
  });
}

export async function duplicateTrainingTemplate(
  templateId: string,
  context: MutationContext,
) {
  const sourceTemplate = await prisma.trainingTemplate.findUnique({
    where: { id: templateId },
    select: {
      id: true,
      name: true,
      slug: true,
      modalityId: true,
      teacherProfileId: true,
      level: true,
      description: true,
      objective: true,
      durationMinutes: true,
      content: true,
      isActive: true,
    },
  });

  if (!sourceTemplate) {
    throw new NotFoundError("Modelo de treino nao encontrado.");
  }

  assertCanManageTemplate(context.viewer, sourceTemplate);

  const teacherProfileId =
    context.viewer.role === UserRole.PROFESSOR
      ? requireTeacherViewerContext(context.viewer)
      : sourceTemplate.teacherProfileId;

  if (teacherProfileId) {
    await ensureTeacherProfileVisible(context.viewer, teacherProfileId);
  }

  const slug = await generateUniqueTemplateSlug(slugify(`${sourceTemplate.slug}-copia`));

  const duplicated = await prisma.trainingTemplate.create({
    data: {
      name: `${sourceTemplate.name} (Copia)`,
      slug,
      modalityId: sourceTemplate.modalityId,
      teacherProfileId,
      level: sourceTemplate.level,
      description: sourceTemplate.description,
      objective: sourceTemplate.objective,
      durationMinutes: sourceTemplate.durationMinutes,
      content: sourceTemplate.content as Prisma.InputJsonValue,
      isActive: true,
    },
    select: { id: true, name: true, slug: true, level: true },
  });

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: "TRAINING_TEMPLATE_DUPLICATED",
    entityType: "TrainingTemplate",
    entityId: duplicated.id,
    summary: `Modelo de treino ${duplicated.name} duplicado.`,
    afterData: {
      sourceTemplateId: sourceTemplate.id,
      slug: duplicated.slug,
      teacherProfileId,
    },
  });

  return duplicated;
}
