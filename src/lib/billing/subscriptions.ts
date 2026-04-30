import { Prisma, StudentStatus, SubscriptionStatus } from "@prisma/client";
import {
  ensureVisibleSubscription,
  getSubscriptionVisibilityWhere,
} from "@/lib/billing/access";
import { logAuditEvent } from "@/lib/audit";
import { type ViewerContext } from "@/lib/academy/access";
import { NotFoundError, ConflictError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { buildOffsetPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import {
  type SubscriptionFiltersInput,
  type CreateSubscriptionInput,
  type UpdateSubscriptionInput,
  type MutationContext,
  autoSyncedSubscriptionStatuses,
  parseDateOnly,
  addMonths,
  normalizeOptionalString,
  buildPlanRecurrenceMonths,
  ensureStudentExists,
  ensurePlanExists,
  syncSubscriptionFinancialStatus,
  getSubscriptionOptions,
} from "@/lib/billing/utils";

export async function getSubscriptionsIndexData(
  viewer: ViewerContext,
  filters: SubscriptionFiltersInput,
) {
  const where: Prisma.SubscriptionWhereInput = {
    AND: [
      getSubscriptionVisibilityWhere(viewer),
      filters.search
        ? {
            OR: [
              {
                studentProfile: {
                  user: { name: { contains: filters.search, mode: "insensitive" } },
                },
              },
              {
                studentProfile: {
                  registrationNumber: { contains: filters.search, mode: "insensitive" },
                },
              },
              { plan: { name: { contains: filters.search, mode: "insensitive" } } },
            ],
          }
        : {},
      filters.studentId ? { studentProfileId: filters.studentId } : {},
      filters.planId ? { planId: filters.planId } : {},
      filters.status ? { status: filters.status } : {},
      filters.autoRenew === true
        ? { autoRenew: true }
        : filters.autoRenew === false
          ? { autoRenew: false }
          : {},
      filters.dateFrom || filters.dateTo
        ? {
            startDate: {
              ...(filters.dateFrom ? { gte: parseDateOnly(filters.dateFrom) } : {}),
              ...(filters.dateTo ? { lte: parseDateOnly(filters.dateTo) } : {}),
            },
          }
        : {},
    ],
  };

  const [totalSubscriptions, summaryRows, options] = await Promise.all([
    prisma.subscription.count({ where }),
    prisma.subscription.findMany({
      where,
      select: { status: true, autoRenew: true, priceCents: true, discountCents: true },
    }),
    getSubscriptionOptions(viewer),
  ]);
  const pagination = buildOffsetPagination({
    page: filters.page,
    totalItems: totalSubscriptions,
  });
  const subscriptions = await prisma.subscription.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    skip: pagination.skip,
    take: pagination.limit,
    select: {
      id: true,
      status: true,
      startDate: true,
      endDate: true,
      renewalDay: true,
      autoRenew: true,
      priceCents: true,
      discountCents: true,
      notes: true,
      createdAt: true,
      studentProfile: {
        select: {
          id: true,
          registrationNumber: true,
          status: true,
          user: { select: { name: true, email: true, isActive: true } },
        },
      },
      plan: {
        select: {
          id: true,
          name: true,
          active: true,
          priceCents: true,
          billingIntervalMonths: true,
          durationMonths: true,
        },
      },
      checkoutPayment: { select: { checkoutUrl: true, status: true } },
      payments: {
        where: { status: "PENDING" },
        orderBy: [{ dueDate: "asc" }],
        take: 1,
        select: { id: true, amountCents: true, dueDate: true, status: true },
      },
      _count: { select: { payments: true } },
    },
  });

  const summary = {
    totalSubscriptions,
    activeSubscriptions: summaryRows.filter(
      (s) => s.status === SubscriptionStatus.ACTIVE,
    ).length,
    overdueSubscriptions: summaryRows.filter(
      (s) => s.status === SubscriptionStatus.PAST_DUE,
    ).length,
    autoRenewSubscriptions: summaryRows.filter((s) => s.autoRenew).length,
    recurringRevenueCents: summaryRows
      .filter((s) => autoSyncedSubscriptionStatuses.includes(s.status))
      .reduce((total, s) => total + Math.max(0, s.priceCents - s.discountCents), 0),
  };

  return {
    subscriptions,
    pagination,
    summary,
    options,
    canManage: hasPermission(viewer.role, "manageSubscriptions"),
  };
}

export async function getSubscriptionDetailData(
  viewer: ViewerContext,
  subscriptionId: string,
) {
  await ensureVisibleSubscription(viewer, subscriptionId);

  const subscription = await prisma.subscription.findFirst({
    where: {
      AND: [getSubscriptionVisibilityWhere(viewer), { id: subscriptionId }],
    },
    select: {
      id: true,
      status: true,
      startDate: true,
      endDate: true,
      renewalDay: true,
      autoRenew: true,
      priceCents: true,
      discountCents: true,
      notes: true,
      createdAt: true,
      cancelledAt: true,
      createdByUser: { select: { name: true } },
      studentProfile: {
        select: {
          id: true,
          registrationNumber: true,
          status: true,
          user: { select: { name: true, email: true, isActive: true } },
        },
      },
      plan: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          benefits: true,
          priceCents: true,
          billingIntervalMonths: true,
          durationMonths: true,
          active: true,
        },
      },
      checkoutPayment: { select: { checkoutUrl: true, status: true } },
      payments: {
        orderBy: [{ dueDate: "desc" }, { createdAt: "desc" }],
        take: 12,
        select: {
          id: true,
          amountCents: true,
          status: true,
          method: true,
          dueDate: true,
          paidAt: true,
          description: true,
        },
      },
      _count: { select: { payments: true } },
    },
  });

  if (!subscription) {
    throw new NotFoundError("Assinatura nao encontrada.");
  }

  return {
    subscription,
    options: await getSubscriptionOptions(viewer),
    canManage: hasPermission(viewer.role, "manageSubscriptions"),
  };
}

export async function createSubscription(
  input: CreateSubscriptionInput,
  context: MutationContext,
) {
  const startDate = parseDateOnly(input.startDate)!;

  const result = await prisma.$transaction(async (tx) => {
    const student = await ensureStudentExists(tx, input.studentProfileId);
    const plan = await ensurePlanExists(tx, input.planId);

    if (!plan.active) {
      throw new ConflictError("Selecione um plano ativo para criar a assinatura.");
    }

    if (student.status === StudentStatus.INACTIVE || !student.user.isActive) {
      throw new ConflictError(
        "Nao e possivel criar assinatura para um aluno inativo.",
      );
    }

    const endDate =
      parseDateOnly(input.endDate) ??
      addMonths(startDate, buildPlanRecurrenceMonths(plan));

    const subscription = await tx.subscription.create({
      data: {
        studentProfileId: input.studentProfileId,
        planId: input.planId,
        status: input.status,
        startDate,
        endDate,
        renewalDay: input.renewalDay ?? startDate.getUTCDate(),
        autoRenew: input.autoRenew ?? false,
        priceCents: input.priceCents ?? plan.priceCents,
        discountCents: input.discountCents ?? 0,
        notes: normalizeOptionalString(input.notes),
        createdByUserId: context.viewer.userId,
      },
      select: { id: true, status: true },
    });

    if (autoSyncedSubscriptionStatuses.includes(input.status)) {
      await syncSubscriptionFinancialStatus(tx, subscription.id);
    }

    return subscription;
  });

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: "SUBSCRIPTION_CREATED",
    entityType: "Subscription",
    entityId: result.id,
    summary: "Assinatura criada.",
    afterData: {
      studentProfileId: input.studentProfileId,
      planId: input.planId,
      status: input.status,
      autoRenew: input.autoRenew ?? false,
    },
  });

  return result;
}

export async function updateSubscription(
  input: UpdateSubscriptionInput,
  context: MutationContext,
) {
  const existing = await prisma.subscription.findUnique({
    where: { id: input.id },
    select: {
      id: true,
      planId: true,
      status: true,
      startDate: true,
      endDate: true,
      autoRenew: true,
      priceCents: true,
      discountCents: true,
    },
  });

  if (!existing) {
    throw new NotFoundError("Assinatura nao encontrada.");
  }

  const startDate = parseDateOnly(input.startDate)!;

  const subscription = await prisma.$transaction(async (tx) => {
    const student = await ensureStudentExists(tx, input.studentProfileId);
    const plan = await ensurePlanExists(tx, input.planId);

    if (!plan.active && plan.id !== existing.planId) {
      throw new ConflictError("Selecione um plano ativo.");
    }

    if (student.status === StudentStatus.INACTIVE || !student.user.isActive) {
      throw new ConflictError(
        "Nao e possivel manter assinatura em um aluno inativo.",
      );
    }

    const updated = await tx.subscription.update({
      where: { id: input.id },
      data: {
        studentProfileId: input.studentProfileId,
        planId: input.planId,
        status: input.status,
        startDate,
        endDate:
          parseDateOnly(input.endDate) ??
          addMonths(startDate, buildPlanRecurrenceMonths(plan)),
        renewalDay: input.renewalDay ?? startDate.getUTCDate(),
        autoRenew:
          input.status === SubscriptionStatus.CANCELLED
            ? false
            : (input.autoRenew ?? false),
        priceCents: input.priceCents ?? plan.priceCents,
        discountCents: input.discountCents ?? 0,
        notes: normalizeOptionalString(input.notes),
        cancelledAt:
          input.status === SubscriptionStatus.CANCELLED ? new Date() : null,
      },
      select: { id: true, status: true, autoRenew: true },
    });

    if (autoSyncedSubscriptionStatuses.includes(input.status)) {
      await syncSubscriptionFinancialStatus(tx, updated.id);
    }

    return updated;
  });

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: "SUBSCRIPTION_UPDATED",
    entityType: "Subscription",
    entityId: subscription.id,
    summary: "Assinatura atualizada.",
    beforeData: {
      status: existing.status,
      startDate: existing.startDate.toISOString(),
      endDate: existing.endDate?.toISOString() ?? null,
      autoRenew: existing.autoRenew,
      priceCents: existing.priceCents,
      discountCents: existing.discountCents,
    },
    afterData: {
      status: subscription.status,
      autoRenew: subscription.autoRenew,
      planId: input.planId,
      studentProfileId: input.studentProfileId,
      priceCents: input.priceCents,
      discountCents: input.discountCents,
    },
  });

  return subscription;
}

export async function cancelSubscription(
  subscriptionId: string,
  context: MutationContext,
) {
  const existing = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new NotFoundError("Assinatura nao encontrada.");
  }

  const subscription = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: SubscriptionStatus.CANCELLED,
      autoRenew: false,
      cancelledAt: new Date(),
    },
    select: { id: true, status: true },
  });

  await logAuditEvent({
    request: context.request,
    actorId: context.viewer.userId,
    action: "SUBSCRIPTION_CANCELLED",
    entityType: "Subscription",
    entityId: subscription.id,
    summary: "Assinatura cancelada.",
    beforeData: { status: existing.status },
    afterData: { status: subscription.status },
  });

  return subscription;
}
