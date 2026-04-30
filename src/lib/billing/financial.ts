import { PaymentStatus, SubscriptionStatus } from "@prisma/client";
import {
  getPaymentVisibilityWhere,
  getSubscriptionVisibilityWhere,
} from "@/lib/billing/access";
import { type ViewerContext } from "@/lib/academy/access";
import { startOfDay } from "@/lib/academy/constants";
import { ConflictError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { isPaymentOverdue } from "@/lib/billing/constants";

export async function getStudentFinancialSnapshot(viewer: ViewerContext) {
  if (!viewer.studentProfileId) {
    return null;
  }

  const today = startOfDay();
  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      studentProfileId: viewer.studentProfileId,
      status: {
        in: [
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.PAST_DUE,
          SubscriptionStatus.PENDING,
          SubscriptionStatus.PAUSED,
        ],
      },
    },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      status: true,
      startDate: true,
      endDate: true,
      autoRenew: true,
      renewalDay: true,
      priceCents: true,
      discountCents: true,
      plan: {
        select: {
          id: true,
          name: true,
          priceCents: true,
          billingIntervalMonths: true,
        },
      },
    },
  });
  const nextPayment = await prisma.payment.findFirst({
    where: { studentProfileId: viewer.studentProfileId, status: PaymentStatus.PENDING },
    orderBy: [{ dueDate: "asc" }],
    select: {
      id: true,
      amountCents: true,
      dueDate: true,
      status: true,
      method: true,
    },
  });
  const recentPayments = await prisma.payment.findMany({
    where: { studentProfileId: viewer.studentProfileId },
    orderBy: [{ dueDate: "desc" }, { createdAt: "desc" }],
    take: 6,
    select: {
      id: true,
      amountCents: true,
      status: true,
      method: true,
      dueDate: true,
      paidAt: true,
      description: true,
    },
  });

  const hasOverdueOpenPayment = nextPayment
    ? isPaymentOverdue(nextPayment.status, nextPayment.dueDate, today)
    : false;

  return {
    activeSubscription,
    nextPayment,
    recentPayments,
    financialStatus:
      hasOverdueOpenPayment ||
      activeSubscription?.status === SubscriptionStatus.PAST_DUE
        ? "inadimplente"
        : nextPayment
          ? "em_dia"
          : "sem_cobranca_aberta",
  };
}

export async function assertStudentMayAttend(studentProfileId: string) {
  const today = startOfDay();

  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      studentProfileId,
      status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAUSED] },
    },
    select: { id: true, status: true, endDate: true },
  });

  if (!activeSubscription) {
    throw new ConflictError(
      "Aluno sem assinatura ativa. Regularize o plano antes de registrar a presenca.",
    );
  }

  if (
    activeSubscription.endDate &&
    activeSubscription.endDate.getTime() < today.getTime()
  ) {
    throw new ConflictError(
      "A assinatura do aluno esta expirada. Renove antes de registrar a presenca.",
    );
  }

  const overduePayment = await prisma.payment.findFirst({
    where: {
      studentProfileId,
      status: PaymentStatus.PENDING,
      dueDate: { lt: today },
    },
    select: { id: true, dueDate: true },
  });

  if (overduePayment) {
    throw new ConflictError(
      "Aluno inadimplente: existe ao menos uma cobranca vencida em aberto.",
    );
  }
}

export async function getFinancialOverviewData(viewer: ViewerContext) {
  const where = getPaymentVisibilityWhere(viewer);
  const today = startOfDay();

  const [pendingPayments, overduePayments, activeSubscriptions] =
    await prisma.$transaction([
      prisma.payment.aggregate({
        where: { AND: [where, { status: PaymentStatus.PENDING }] },
        _count: { _all: true },
        _sum: { amountCents: true },
      }),
      prisma.payment.aggregate({
        where: {
          AND: [
            where,
            { status: PaymentStatus.PENDING, dueDate: { lt: today } },
          ],
        },
        _count: { _all: true },
        _sum: { amountCents: true },
      }),
      prisma.subscription.count({
        where: {
          AND: [
            getSubscriptionVisibilityWhere(viewer),
            {
              status: {
                in: [
                  SubscriptionStatus.ACTIVE,
                  SubscriptionStatus.PAST_DUE,
                  SubscriptionStatus.PENDING,
                ],
              },
            },
          ],
        },
      }),
    ]);

  return {
    pendingPayments: pendingPayments._count._all,
    pendingAmountCents: pendingPayments._sum.amountCents ?? 0,
    overduePayments: overduePayments._count._all,
    overdueAmountCents: overduePayments._sum.amountCents ?? 0,
    activeSubscriptions,
  };
}
