import type { z } from "zod";
import {
  PaymentMethod,
  PaymentStatus,
  Prisma,
  StudentStatus,
  SubscriptionStatus,
} from "@prisma/client";
import {
  getPaymentMethodFilterValues,
  isPaymentOverdue,
  type PaymentMethodFilter,
  type PaymentFilterStatus,
} from "@/lib/billing/constants";
import { getModalityVisibilityWhere, type ViewerContext } from "@/lib/academy/access";
import { startOfDay } from "@/lib/academy/constants";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  createPaymentSchema,
  createPlanSchema,
  createSubscriptionSchema,
  paymentFiltersSchema,
  planFiltersSchema,
  subscriptionFiltersSchema,
  updatePaymentSchema,
  updatePlanSchema,
  updateSubscriptionSchema,
} from "@/lib/validators";

export const autoSyncedSubscriptionStatuses: SubscriptionStatus[] = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.PAST_DUE,
  SubscriptionStatus.PENDING,
];

export type PlanFiltersInput = z.infer<typeof planFiltersSchema>;
export type SubscriptionFiltersInput = z.infer<typeof subscriptionFiltersSchema>;
export type PaymentFiltersInput = z.infer<typeof paymentFiltersSchema>;
export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;

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

export function addMonths(date: Date, amount: number) {
  const value = new Date(date);
  value.setUTCMonth(value.getUTCMonth() + amount);
  return value;
}

export function normalizeOptionalString(value?: string | null) {
  return value?.trim() || null;
}

export function normalizeBenefits(benefits: string[]) {
  return Array.from(new Set(benefits.map((item) => item.trim()).filter(Boolean)));
}

export function buildPlanRecurrenceMonths(input: {
  durationMonths?: number | null;
  billingIntervalMonths: number;
}) {
  return input.durationMonths ?? input.billingIntervalMonths;
}

export function buildPaymentStatusWhere(
  status?: PaymentFilterStatus,
  referenceDate = startOfDay(),
): Prisma.PaymentWhereInput | undefined {
  if (!status) {
    return undefined;
  }

  if (status === "OVERDUE") {
    return {
      status: PaymentStatus.PENDING,
      dueDate: { lt: referenceDate },
    };
  }

  return { status };
}

export function buildPaymentMethodWhere(
  method?: PaymentMethodFilter,
): Prisma.PaymentWhereInput | undefined {
  if (!method) {
    return undefined;
  }

  return { method: { in: getPaymentMethodFilterValues(method) } };
}

export async function ensureActiveModality(
  tx: Prisma.TransactionClient,
  modalityId: string,
) {
  const modality = await tx.modality.findUnique({
    where: { id: modalityId },
    select: { id: true, isActive: true },
  });

  if (!modality) {
    throw new NotFoundError("Modalidade nao encontrada.");
  }

  if (!modality.isActive) {
    throw new ConflictError("Selecione uma modalidade ativa.");
  }

  return modality;
}

export async function ensureStudentExists(
  tx: Prisma.TransactionClient,
  studentProfileId: string,
) {
  const student = await tx.studentProfile.findUnique({
    where: { id: studentProfileId },
    select: {
      id: true,
      status: true,
      registrationNumber: true,
      user: {
        select: { id: true, name: true, email: true, isActive: true },
      },
    },
  });

  if (!student) {
    throw new NotFoundError("Aluno nao encontrado.");
  }

  return student;
}

export async function ensurePlanExists(
  tx: Prisma.TransactionClient,
  planId: string,
) {
  const plan = await tx.plan.findUnique({
    where: { id: planId },
    select: {
      id: true,
      name: true,
      active: true,
      priceCents: true,
      billingIntervalMonths: true,
      durationMonths: true,
      modalityId: true,
    },
  });

  if (!plan) {
    throw new NotFoundError("Plano nao encontrado.");
  }

  return plan;
}

export async function ensureSubscriptionForStudent(
  tx: Prisma.TransactionClient,
  subscriptionId: string,
  studentProfileId: string,
) {
  const subscription = await tx.subscription.findUnique({
    where: { id: subscriptionId },
    select: {
      id: true,
      studentProfileId: true,
      status: true,
      startDate: true,
      endDate: true,
      autoRenew: true,
      renewalDay: true,
      priceCents: true,
      discountCents: true,
      plan: { select: { id: true, name: true, active: true } },
    },
  });

  if (!subscription) {
    throw new NotFoundError("Assinatura nao encontrada.");
  }

  if (subscription.studentProfileId !== studentProfileId) {
    throw new ConflictError(
      "A assinatura selecionada nao pertence ao aluno informado.",
    );
  }

  return subscription;
}

export async function ensureNoDuplicatePayment(
  tx: Prisma.TransactionClient,
  input: {
    paymentId?: string;
    studentProfileId: string;
    subscriptionId: string;
    dueDate: Date;
  },
) {
  const existing = await tx.payment.findFirst({
    where: {
      studentProfileId: input.studentProfileId,
      subscriptionId: input.subscriptionId,
      dueDate: input.dueDate,
      status: { in: [PaymentStatus.PENDING, PaymentStatus.PAID] },
      ...(input.paymentId ? { id: { not: input.paymentId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictError(
      "Ja existe uma mensalidade aberta ou paga para esta assinatura na data informada.",
    );
  }
}

export async function syncSubscriptionFinancialStatus(
  tx: Prisma.TransactionClient,
  subscriptionId: string,
) {
  const subscription = await tx.subscription.findUnique({
    where: { id: subscriptionId },
    select: {
      id: true,
      status: true,
      startDate: true,
      endDate: true,
      cancelledAt: true,
    },
  });

  if (!subscription) {
    return null;
  }

  if (
    subscription.status === SubscriptionStatus.CANCELLED ||
    subscription.status === SubscriptionStatus.PAUSED
  ) {
    return subscription.status;
  }

  const today = startOfDay();
  const overduePayments = await tx.payment.count({
    where: {
      subscriptionId,
      status: PaymentStatus.PENDING,
      dueDate: { lt: today },
    },
  });

  let nextStatus = subscription.status;

  if (subscription.endDate && startOfDay(subscription.endDate) < today) {
    nextStatus = SubscriptionStatus.EXPIRED;
  } else if (overduePayments > 0) {
    nextStatus = SubscriptionStatus.PAST_DUE;
  } else if (startOfDay(subscription.startDate) > today) {
    nextStatus = SubscriptionStatus.PENDING;
  } else {
    nextStatus = SubscriptionStatus.ACTIVE;
  }

  if (nextStatus !== subscription.status) {
    await tx.subscription.update({
      where: { id: subscriptionId },
      data: { status: nextStatus },
    });
  }

  return nextStatus;
}

export async function getPlanOptions(viewer: ViewerContext) {
  const modalities = await prisma.modality.findMany({
    where: { AND: [getModalityVisibilityWhere(viewer), { isActive: true }] },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  return { modalities };
}

export async function getSubscriptionOptions(viewer: ViewerContext) {
  if (!hasPermission(viewer.role, "manageSubscriptions")) {
    return null;
  }

  const [students, plans] = await prisma.$transaction([
    prisma.studentProfile.findMany({
      where: {
        status: { not: StudentStatus.INACTIVE },
        user: { isActive: true },
      },
      orderBy: { user: { name: "asc" } },
      select: {
        id: true,
        registrationNumber: true,
        user: { select: { name: true } },
      },
    }),
    prisma.plan.findMany({
      where: { active: true },
      orderBy: [{ name: "asc" }],
      select: { id: true, name: true, priceCents: true },
    }),
  ]);

  return { students, plans };
}

export async function getPaymentOptions(viewer: ViewerContext) {
  if (!hasPermission(viewer.role, "managePayments")) {
    return null;
  }

  const [students, subscriptions] = await prisma.$transaction([
    prisma.studentProfile.findMany({
      where: { user: { isActive: true } },
      orderBy: { user: { name: "asc" } },
      select: {
        id: true,
        registrationNumber: true,
        user: { select: { name: true } },
      },
    }),
    prisma.subscription.findMany({
      where: {
        status: {
          in: [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.PAST_DUE,
            SubscriptionStatus.PENDING,
            SubscriptionStatus.PAUSED,
            SubscriptionStatus.EXPIRED,
          ],
        },
      },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        studentProfileId: true,
        status: true,
        studentProfile: {
          select: {
            registrationNumber: true,
            user: { select: { name: true } },
          },
        },
        plan: { select: { name: true } },
      },
    }),
  ]);

  return { students, subscriptions };
}
