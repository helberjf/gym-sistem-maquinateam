import { Prisma, SubscriptionStatus } from "@prisma/client";
import {
  ensureVisiblePlan,
  getPlanVisibilityWhere,
  getSubscriptionVisibilityWhere,
} from "@/lib/billing/access";
import { logAuditEvent } from "@/lib/audit";
import { type ViewerContext } from "@/lib/academy/access";
import { slugify } from "@/lib/academy/constants";
import { NotFoundError, ConflictError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { buildOffsetPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import {
  type PlanFiltersInput,
  type CreatePlanInput,
  type UpdatePlanInput,
  type MutationContext,
  ensureActiveModality,
  getPlanOptions,
  normalizeOptionalString,
  normalizeBenefits,
} from "@/lib/billing/utils";

export async function getPlansIndexData(
  viewer: ViewerContext,
  filters: PlanFiltersInput,
) {
  const where: Prisma.PlanWhereInput = {
    AND: [
      getPlanVisibilityWhere(viewer),
      filters.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { slug: { contains: filters.search, mode: "insensitive" } },
              { description: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {},
      filters.modalityId ? { modalityId: filters.modalityId } : {},
      filters.active === true
        ? { active: true }
        : filters.active === false
          ? { active: false }
          : {},
    ],
  };

  const [totalPlans, activePlans, planPriceStats, options] = await Promise.all([
    prisma.plan.count({ where }),
    prisma.plan.count({ where: { AND: [where, { active: true }] } }),
    prisma.plan.aggregate({ where, _avg: { priceCents: true } }),
    getPlanOptions(viewer),
  ]);
  const pagination = buildOffsetPagination({ page: filters.page, totalItems: totalPlans });
  const plans = await prisma.plan.findMany({
    where,
    orderBy: [{ active: "desc" }, { name: "asc" }],
    skip: pagination.skip,
    take: pagination.limit,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      benefits: true,
      priceCents: true,
      billingIntervalMonths: true,
      durationMonths: true,
      sessionsPerWeek: true,
      isUnlimited: true,
      enrollmentFeeCents: true,
      active: true,
      modality: { select: { id: true, name: true } },
      _count: { select: { subscriptions: true } },
    },
  });

  return {
    plans,
    pagination,
    summary: {
      totalPlans,
      activePlans,
      inactivePlans: Math.max(0, totalPlans - activePlans),
      averagePriceCents: Math.round(planPriceStats._avg.priceCents ?? 0),
    },
    options,
    canManage: hasPermission(viewer.role, "managePlans"),
  };
}

export async function getPlanDetailData(viewer: ViewerContext, planId: string) {
  await ensureVisiblePlan(viewer, planId);

  const plan = await prisma.plan.findFirst({
    where: { AND: [getPlanVisibilityWhere(viewer), { id: planId }] },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      benefits: true,
      priceCents: true,
      billingIntervalMonths: true,
      durationMonths: true,
      sessionsPerWeek: true,
      isUnlimited: true,
      enrollmentFeeCents: true,
      active: true,
      modalityId: true,
      modality: { select: { id: true, name: true } },
      subscriptions: {
        where: getSubscriptionVisibilityWhere(viewer),
        take: 8,
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          studentProfile: {
            select: {
              id: true,
              registrationNumber: true,
              user: { select: { name: true } },
            },
          },
        },
      },
      _count: { select: { subscriptions: true } },
    },
  });

  if (!plan) {
    throw new NotFoundError("Plano nao encontrado.");
  }

  return {
    plan,
    options: await getPlanOptions(viewer),
    canManage: hasPermission(viewer.role, "managePlans"),
  };
}

export async function createPlan(input: CreatePlanInput, context: MutationContext) {
  const slug = input.slug ?? slugify(input.name);

  const plan = await prisma.$transaction(async (tx) => {
    if (input.modalityId) {
      await ensureActiveModality(tx, input.modalityId);
    }

    return tx.plan.create({
      data: {
        name: input.name,
        slug,
        description: normalizeOptionalString(input.description),
        benefits: normalizeBenefits(input.benefits),
        modalityId: input.modalityId ?? null,
        priceCents: input.priceCents,
        billingIntervalMonths: input.billingIntervalMonths,
        durationMonths: input.durationMonths ?? null,
        sessionsPerWeek: input.sessionsPerWeek ?? null,
        isUnlimited: input.isUnlimited ?? false,
        enrollmentFeeCents: input.enrollmentFeeCents,
        active: input.active ?? true,
      },
      select: { id: true, name: true, slug: true },
    });
  });

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: "PLAN_CREATED",
    entityType: "Plan",
    entityId: plan.id,
    summary: `Plano ${plan.name} criado.`,
    afterData: {
      slug: plan.slug,
      priceCents: input.priceCents,
      billingIntervalMonths: input.billingIntervalMonths,
    },
  });

  return plan;
}

export async function updatePlan(input: UpdatePlanInput, context: MutationContext) {
  const existing = await prisma.plan.findUnique({
    where: { id: input.id },
    select: { id: true, name: true, slug: true, active: true },
  });

  if (!existing) {
    throw new NotFoundError("Plano nao encontrado.");
  }

  if (input.active === false) {
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        planId: input.id,
        status: {
          in: [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.PAST_DUE,
            SubscriptionStatus.PENDING,
            SubscriptionStatus.PAUSED,
          ],
        },
      },
    });

    if (activeSubscriptions > 0) {
      throw new ConflictError(
        "Nao e possivel inativar um plano que ainda possui assinaturas vigentes.",
      );
    }
  }

  const plan = await prisma.$transaction(async (tx) => {
    if (input.modalityId) {
      await ensureActiveModality(tx, input.modalityId);
    }

    return tx.plan.update({
      where: { id: input.id },
      data: {
        name: input.name,
        slug: input.slug ?? existing.slug,
        description: normalizeOptionalString(input.description),
        benefits: normalizeBenefits(input.benefits),
        modalityId: input.modalityId ?? null,
        priceCents: input.priceCents,
        billingIntervalMonths: input.billingIntervalMonths,
        durationMonths: input.durationMonths ?? null,
        sessionsPerWeek: input.sessionsPerWeek ?? null,
        isUnlimited: input.isUnlimited ?? false,
        enrollmentFeeCents: input.enrollmentFeeCents,
        active: input.active ?? true,
      },
      select: { id: true, name: true, slug: true, active: true },
    });
  });

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: "PLAN_UPDATED",
    entityType: "Plan",
    entityId: plan.id,
    summary: `Plano ${plan.name} atualizado.`,
    beforeData: { slug: existing.slug, active: existing.active },
    afterData: { slug: plan.slug, active: plan.active, priceCents: input.priceCents },
  });

  return plan;
}

export async function archivePlan(planId: string, context: MutationContext) {
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    select: { id: true, name: true, active: true },
  });

  if (!plan) {
    throw new NotFoundError("Plano nao encontrado.");
  }

  const activeSubscriptions = await prisma.subscription.count({
    where: {
      planId,
      status: {
        in: [
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.PAST_DUE,
          SubscriptionStatus.PENDING,
          SubscriptionStatus.PAUSED,
        ],
      },
    },
  });

  if (activeSubscriptions > 0) {
    throw new ConflictError(
      "Nao e possivel arquivar um plano com assinaturas vigentes.",
    );
  }

  await prisma.plan.update({ where: { id: planId }, data: { active: false } });

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: "PLAN_ARCHIVED",
    entityType: "Plan",
    entityId: plan.id,
    summary: `Plano ${plan.name} arquivado.`,
    beforeData: { active: plan.active },
    afterData: { active: false },
  });
}
