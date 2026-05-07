import {
  Prisma,
  ReviewStatus,
  ReviewTargetType,
  type Review,
} from "@prisma/client";
import type { ViewerContext } from "@/lib/academy/access";
import { logAuditEvent } from "@/lib/audit";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/errors";
import { buildOffsetPagination } from "@/lib/pagination";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type {
  CreateReviewInput,
  ModerateReviewInput,
  ReviewFiltersInput,
  UpdateOwnReviewInput,
} from "@/lib/validators/reviews";

type MutationContext = {
  viewer: ViewerContext;
  request?: Request;
};

const DEFAULT_PAGE_SIZE = 20;

async function ensureTargetExists(
  targetType: ReviewTargetType,
  targetId: string,
) {
  if (targetType === ReviewTargetType.TEACHER) {
    const found = await prisma.teacherProfile.findUnique({
      where: { id: targetId },
      select: { id: true, isActive: true },
    });
    if (!found) throw new NotFoundError("Professor nao encontrado.");
    if (!found.isActive) throw new BadRequestError("Professor inativo.");
    return;
  }
  if (targetType === ReviewTargetType.MODALITY) {
    const found = await prisma.modality.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!found) throw new NotFoundError("Modalidade nao encontrada.");
    return;
  }
  if (targetType === ReviewTargetType.CLASS_SCHEDULE) {
    const found = await prisma.classSchedule.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!found) throw new NotFoundError("Turma nao encontrada.");
    return;
  }
  // FACILITY: free-form key (e.g. "main_gym", "studio_a"). Sem validacao explicita.
  if (targetId.length === 0 || targetId.length > 60) {
    throw new BadRequestError("Identificador da instalacao invalido.");
  }
}

export async function createReview(
  input: CreateReviewInput,
  context: MutationContext,
) {
  if (!hasPermission(context.viewer.role, "createReview")) {
    throw new ForbiddenError("Sem permissao para avaliar.");
  }

  await ensureTargetExists(input.targetType, input.targetId);

  try {
    const created = await prisma.review.create({
      data: {
        authorId: context.viewer.userId,
        targetType: input.targetType,
        targetId: input.targetId,
        rating: input.rating,
        comment: input.comment ?? null,
        // ALUNO reviews entram como PENDING; staff posta como APPROVED direto.
        status:
          context.viewer.role === "ALUNO"
            ? ReviewStatus.PENDING
            : ReviewStatus.APPROVED,
        moderatedById:
          context.viewer.role === "ALUNO" ? null : context.viewer.userId,
        moderatedAt:
          context.viewer.role === "ALUNO" ? null : new Date(),
      },
    });

    await logAuditEvent({
      actorId: context.viewer.userId,
      action: "review.create",
      entityType: "Review",
      entityId: created.id,
      summary: `Review ${input.targetType}/${input.targetId} criado (rating ${input.rating}).`,
      afterData: created,
      request: context.request,
    });

    return created;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new BadRequestError(
        "Voce ja avaliou este item. Edite a avaliacao existente.",
      );
    }
    throw error;
  }
}

export async function updateOwnReview(
  id: string,
  input: UpdateOwnReviewInput,
  context: MutationContext,
) {
  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Review nao encontrado.");
  if (existing.authorId !== context.viewer.userId) {
    throw new ForbiddenError("Voce so pode editar suas proprias avaliacoes.");
  }
  if (existing.status === ReviewStatus.REJECTED) {
    throw new BadRequestError(
      "Avaliacao rejeitada nao pode ser editada. Crie uma nova.",
    );
  }

  const updated = await prisma.review.update({
    where: { id },
    data: {
      rating: input.rating,
      comment: input.comment !== undefined ? input.comment ?? null : undefined,
      // Edicao de ALUNO volta para moderacao.
      status:
        context.viewer.role === "ALUNO"
          ? ReviewStatus.PENDING
          : existing.status,
      moderatedById:
        context.viewer.role === "ALUNO" ? null : existing.moderatedById,
      moderatedAt:
        context.viewer.role === "ALUNO" ? null : existing.moderatedAt,
    },
  });

  await logAuditEvent({
    actorId: context.viewer.userId,
    action: "review.update",
    entityType: "Review",
    entityId: id,
    summary: `Review ${id} editado.`,
    beforeData: existing,
    afterData: updated,
    request: context.request,
  });

  return updated;
}

export async function moderateReview(
  id: string,
  input: ModerateReviewInput,
  context: MutationContext,
) {
  if (!hasPermission(context.viewer.role, "moderateReviews")) {
    throw new ForbiddenError("Sem permissao para moderar avaliacoes.");
  }

  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Review nao encontrado.");

  const updated = await prisma.review.update({
    where: { id },
    data: {
      status: input.status,
      moderationNote: input.moderationNote ?? null,
      moderatedById: context.viewer.userId,
      moderatedAt: new Date(),
    },
  });

  await logAuditEvent({
    actorId: context.viewer.userId,
    action: `review.${input.status === ReviewStatus.APPROVED ? "approve" : "reject"}`,
    entityType: "Review",
    entityId: id,
    summary: `Review ${id} -> ${input.status}.`,
    beforeData: existing,
    afterData: updated,
    request: context.request,
  });

  return updated;
}

export async function deleteOwnReview(id: string, context: MutationContext) {
  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Review nao encontrado.");

  const isOwner = existing.authorId === context.viewer.userId;
  const canModerate = hasPermission(context.viewer.role, "moderateReviews");
  if (!isOwner && !canModerate) {
    throw new ForbiddenError("Sem permissao.");
  }

  await prisma.review.delete({ where: { id } });

  await logAuditEvent({
    actorId: context.viewer.userId,
    action: "review.delete",
    entityType: "Review",
    entityId: id,
    summary: `Review ${id} removido.`,
    beforeData: existing,
    request: context.request,
  });

  return { id };
}

export async function listPublicReviews(
  targetType: ReviewTargetType,
  targetId: string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
) {
  const where: Prisma.ReviewWhereInput = {
    targetType,
    targetId,
    status: ReviewStatus.APPROVED,
  };

  const total = await prisma.review.count({ where });
  const pagination = buildOffsetPagination({
    page,
    pageSize,
    totalItems: total,
  });

  const items = await prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: pagination.skip,
    take: pagination.limit,
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
  });

  return { items, pagination };
}

export async function listForModeration(
  filters: ReviewFiltersInput,
  viewer: ViewerContext,
) {
  if (!hasPermission(viewer.role, "viewReviewModeration")) {
    throw new ForbiddenError("Sem permissao para ver fila de moderacao.");
  }

  const where: Prisma.ReviewWhereInput = {};
  if (filters.targetType) where.targetType = filters.targetType;
  if (filters.targetId) where.targetId = filters.targetId;
  if (filters.status) where.status = filters.status;

  const total = await prisma.review.count({ where });
  const pagination = buildOffsetPagination({
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? DEFAULT_PAGE_SIZE,
    totalItems: total,
  });

  const items = await prisma.review.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    skip: pagination.skip,
    take: pagination.limit,
    include: {
      author: { select: { id: true, name: true, email: true } },
      moderatedBy: { select: { id: true, name: true } },
    },
  });

  return { items, pagination };
}

export async function getReviewSummary(
  targetType: ReviewTargetType,
  targetId: string,
): Promise<{ count: number; averageRating: number | null }> {
  const aggregate = await prisma.review.aggregate({
    where: {
      targetType,
      targetId,
      status: ReviewStatus.APPROVED,
    },
    _avg: { rating: true },
    _count: { _all: true },
  });

  return {
    count: aggregate._count._all,
    averageRating:
      aggregate._avg.rating !== null
        ? Math.round(aggregate._avg.rating * 10) / 10
        : null,
  };
}

export type ReviewWithAuthor = Awaited<
  ReturnType<typeof listPublicReviews>
>["items"][number];

export type { Review };
