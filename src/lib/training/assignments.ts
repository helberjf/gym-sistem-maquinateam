import { Prisma, TrainingAssignmentStatus, UserRole } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";
import { notifyTrainingPlanCreated } from "@/lib/messaging/events";
import { captureException } from "@/lib/observability/capture";
import { startOfDay } from "@/lib/academy/constants";
import { type ViewerContext } from "@/lib/academy/access";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { extractTrainingStructure } from "@/lib/training/constants";
import {
  ensureVisibleTrainingAssignment,
  getTrainingAssignmentVisibilityWhere,
  getTrainingTemplateVisibilityWhere,
} from "@/lib/training/access";
import {
  type CreateTrainingAssignmentInput,
  type UpdateTrainingAssignmentInput,
  type MutationContext,
  parseDateOnly,
  normalizeOptionalString,
  ensureTeacherProfileVisible,
  ensureVisibleStudentsForAssignments,
  resolveAssignmentTeacherProfileId,
} from "@/lib/training/utils";

export async function getTrainingAssignmentDetailData(
  viewer: ViewerContext,
  assignmentId: string,
) {
  await ensureVisibleTrainingAssignment(viewer, assignmentId);

  const assignment = await prisma.trainingAssignment.findFirst({
    where: { AND: [getTrainingAssignmentVisibilityWhere(viewer), { id: assignmentId }] },
    select: {
      id: true,
      title: true,
      status: true,
      assignedAt: true,
      startAt: true,
      dueAt: true,
      completedAt: true,
      instructions: true,
      studentNotes: true,
      feedback: true,
      content: true,
      studentProfile: {
        select: {
          id: true,
          registrationNumber: true,
          status: true,
          primaryModality: { select: { id: true, name: true } },
          user: { select: { name: true, email: true } },
        },
      },
      teacherProfile: { select: { id: true, user: { select: { name: true, email: true } } } },
      trainingTemplate: {
        select: {
          id: true,
          name: true,
          level: true,
          objective: true,
          modality: { select: { id: true, name: true } },
          content: true,
        },
      },
    },
  });

  if (!assignment) {
    throw new NotFoundError("Treino atribuido nao encontrado.");
  }

  return {
    assignment,
    structure: extractTrainingStructure(
      assignment.content ?? assignment.trainingTemplate?.content ?? null,
    ),
    canManage: hasPermission(viewer.role, "manageTrainings"),
    isStudentOwner:
      viewer.role === UserRole.ALUNO &&
      viewer.studentProfileId === assignment.studentProfile.id,
  };
}

export async function createTrainingAssignments(
  input: CreateTrainingAssignmentInput,
  context: MutationContext,
) {
  const template = await prisma.trainingTemplate.findFirst({
    where: {
      AND: [
        getTrainingTemplateVisibilityWhere(context.viewer),
        { id: input.trainingTemplateId, isActive: true },
      ],
    },
    select: { id: true, name: true, objective: true, teacherProfileId: true, content: true },
  });

  if (!template) {
    throw new NotFoundError("Modelo de treino nao encontrado ou indisponivel.");
  }

  const teacherProfileId =
    resolveAssignmentTeacherProfileId(input, context) ??
    template.teacherProfileId ??
    null;

  if (teacherProfileId) {
    await ensureTeacherProfileVisible(context.viewer, teacherProfileId);
  }

  const students = await ensureVisibleStudentsForAssignments(context.viewer, input.studentIds);
  const assignedAt = parseDateOnly(input.assignedAt) ?? startOfDay();
  const dueAt = parseDateOnly(input.dueAt) ?? null;
  const objective = normalizeOptionalString(input.objective) ?? template.objective;
  const teacherNotes = normalizeOptionalString(input.observacoesProfessor);
  const instructions = normalizeOptionalString(input.instructions);
  const templateStructure = extractTrainingStructure(template.content);

  const duplicatedAssignments = await prisma.trainingAssignment.findMany({
    where: {
      studentProfileId: { in: input.studentIds },
      trainingTemplateId: template.id,
      status: {
        in: [TrainingAssignmentStatus.ASSIGNED, TrainingAssignmentStatus.IN_PROGRESS],
      },
    },
    select: { studentProfileId: true },
  });

  if (duplicatedAssignments.length > 0) {
    const duplicatedIds = new Set(
      duplicatedAssignments.map((assignment) => assignment.studentProfileId),
    );
    const duplicatedStudent = students.find((student) => duplicatedIds.has(student.id));

    throw new ConflictError(
      `Ja existe um treino em andamento para ${duplicatedStudent?.user.name ?? "um dos alunos selecionados"} com este modelo.`,
    );
  }

  const createdAssignments = await prisma.$transaction(
    students.map((student) =>
      prisma.trainingAssignment.create({
        data: {
          studentProfileId: student.id,
          teacherProfileId,
          trainingTemplateId: template.id,
          status: input.status,
          title: normalizeOptionalString(input.title) ?? template.name,
          instructions,
          content: {
            ...templateStructure,
            objective,
            observacoesProfessor: teacherNotes,
          } satisfies Prisma.InputJsonObject,
          assignedAt,
          startAt:
            input.status === TrainingAssignmentStatus.IN_PROGRESS ? assignedAt : null,
          dueAt,
        },
        select: { id: true, title: true, studentProfileId: true, status: true },
      }),
    ),
  );

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: "TRAINING_ASSIGNMENTS_CREATED",
    entityType: "TrainingAssignment",
    summary: `${createdAssignments.length} treino(s) atribuido(s) a partir do modelo ${template.name}.`,
    afterData: {
      templateId: template.id,
      teacherProfileId,
      studentIds: createdAssignments.map((assignment) => assignment.studentProfileId),
      dueAt,
      status: input.status,
    },
  });

  for (const assignment of createdAssignments) {
    try {
      await notifyTrainingPlanCreated({
        studentProfileId: assignment.studentProfileId,
        planTitle: assignment.title,
      });
    } catch (error) {
      captureException(error, {
        source: "training assignment notification",
        extras: {
          assignmentId: assignment.id,
          studentProfileId: assignment.studentProfileId,
        },
      });
    }
  }

  return createdAssignments;
}

export async function updateTrainingAssignment(
  input: UpdateTrainingAssignmentInput,
  context: MutationContext,
) {
  const existing = await prisma.trainingAssignment.findUnique({
    where: { id: input.id },
    select: {
      id: true,
      title: true,
      status: true,
      instructions: true,
      dueAt: true,
      startAt: true,
      completedAt: true,
      studentNotes: true,
      feedback: true,
      content: true,
      studentProfileId: true,
      teacherProfileId: true,
    },
  });

  if (!existing) {
    throw new NotFoundError("Treino atribuido nao encontrado.");
  }

  const isStudentOwner =
    context.viewer.role === UserRole.ALUNO &&
    context.viewer.studentProfileId === existing.studentProfileId;
  const canManage = hasPermission(context.viewer.role, "manageTrainings");

  if (!isStudentOwner && !canManage) {
    throw new ForbiddenError("Acesso negado.");
  }

  if (canManage && !isStudentOwner) {
    await ensureVisibleTrainingAssignment(context.viewer, input.id);
  }

  if (
    isStudentOwner &&
    (input.title !== undefined ||
      input.instructions !== undefined ||
      input.dueAt !== undefined ||
      input.feedback !== undefined)
  ) {
    throw new ForbiddenError(
      "Alunos podem apenas atualizar anotacoes pessoais e o status do proprio treino.",
    );
  }

  if (isStudentOwner && input.status) {
    const allowedTransitions: Partial<
      Record<TrainingAssignmentStatus, TrainingAssignmentStatus[]>
    > = {
      [TrainingAssignmentStatus.ASSIGNED]: [
        TrainingAssignmentStatus.ASSIGNED,
        TrainingAssignmentStatus.IN_PROGRESS,
      ],
      [TrainingAssignmentStatus.IN_PROGRESS]: [
        TrainingAssignmentStatus.IN_PROGRESS,
        TrainingAssignmentStatus.COMPLETED,
      ],
      [TrainingAssignmentStatus.COMPLETED]: [TrainingAssignmentStatus.COMPLETED],
    };

    const nextStatuses = allowedTransitions[existing.status] ?? [];

    if (!nextStatuses.includes(input.status)) {
      throw new ConflictError("Transicao de status nao permitida para o aluno.");
    }
  }

  const nextStatus = input.status ?? existing.status;
  const dueAt = input.dueAt === undefined ? existing.dueAt : parseDateOnly(input.dueAt);
  const nextContent =
    existing.content &&
    typeof existing.content === "object" &&
    !Array.isArray(existing.content)
      ? (existing.content as Prisma.InputJsonObject)
      : ({} as Prisma.InputJsonObject);

  const updated = await prisma.trainingAssignment.update({
    where: { id: input.id },
    data: {
      title:
        !isStudentOwner && input.title !== undefined
          ? normalizeOptionalString(input.title) ?? existing.title
          : undefined,
      instructions:
        !isStudentOwner && input.instructions !== undefined
          ? normalizeOptionalString(input.instructions)
          : undefined,
      dueAt,
      status: nextStatus,
      startAt:
        nextStatus === TrainingAssignmentStatus.IN_PROGRESS
          ? existing.startAt ?? new Date()
          : existing.startAt,
      completedAt:
        nextStatus === TrainingAssignmentStatus.COMPLETED
          ? existing.completedAt ?? new Date()
          : nextStatus === TrainingAssignmentStatus.ASSIGNED ||
              nextStatus === TrainingAssignmentStatus.IN_PROGRESS
            ? null
            : existing.completedAt,
      studentNotes:
        input.studentNotes !== undefined
          ? normalizeOptionalString(input.studentNotes)
          : undefined,
      feedback:
        !isStudentOwner && input.feedback !== undefined
          ? normalizeOptionalString(input.feedback)
          : undefined,
      content:
        !isStudentOwner && input.instructions !== undefined
          ? {
              ...nextContent,
              instructions: normalizeOptionalString(input.instructions),
            }
          : undefined,
    },
    select: { id: true, title: true, status: true, studentProfileId: true },
  });

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: isStudentOwner
      ? "TRAINING_ASSIGNMENT_SELF_UPDATED"
      : "TRAINING_ASSIGNMENT_UPDATED",
    entityType: "TrainingAssignment",
    entityId: updated.id,
    summary: `Treino atribuido ${updated.title} atualizado.`,
    beforeData: existing,
    afterData: {
      status: updated.status,
      dueAt,
      studentNotes: input.studentNotes,
      feedback: input.feedback,
    },
  });

  return updated;
}
