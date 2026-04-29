import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PUBLIC_PLAN_CATALOG,
  type PublicPlanCatalogSeed,
} from "@/lib/billing/public-plan-catalog";

export const FALLBACK_PUBLIC_PLAN_ID_PREFIX = "fallback-plan-";

export function getFallbackPublicPlanId(slug: string) {
  return `${FALLBACK_PUBLIC_PLAN_ID_PREFIX}${slug}`;
}

export function getFallbackPublicPlanSlug(identifier: string) {
  if (!identifier.startsWith(FALLBACK_PUBLIC_PLAN_ID_PREFIX)) {
    return null;
  }

  const slug = identifier.slice(FALLBACK_PUBLIC_PLAN_ID_PREFIX.length).trim();
  return slug.length > 0 ? slug : null;
}

export function getDefaultPublicPlanSeedBySlug(slug: string) {
  return DEFAULT_PUBLIC_PLAN_CATALOG.find((plan) => plan.slug === slug) ?? null;
}

export function getDefaultPublicPlanSeedFromIdentifier(identifier: string) {
  const slug = getFallbackPublicPlanSlug(identifier) ?? identifier;
  return getDefaultPublicPlanSeedBySlug(slug);
}

export function buildPublicPlanCreateData(plan: PublicPlanCatalogSeed) {
  return {
    name: plan.name,
    slug: plan.slug,
    description: plan.description,
    benefits: [...plan.benefits],
    modalityId: null,
    priceCents: plan.priceCents,
    billingIntervalMonths: plan.billingIntervalMonths,
    durationMonths: plan.durationMonths,
    sessionsPerWeek: plan.sessionsPerWeek,
    isUnlimited: plan.isUnlimited,
    enrollmentFeeCents: plan.enrollmentFeeCents,
    active: true,
  };
}

export function buildPublicPlanUpdateData(plan: PublicPlanCatalogSeed) {
  return {
    name: plan.name,
    description: plan.description,
    benefits: [...plan.benefits],
    modalityId: null,
    priceCents: plan.priceCents,
    billingIntervalMonths: plan.billingIntervalMonths,
    durationMonths: plan.durationMonths,
    sessionsPerWeek: plan.sessionsPerWeek,
    isUnlimited: plan.isUnlimited,
    enrollmentFeeCents: plan.enrollmentFeeCents,
    active: true,
  };
}

export async function findActivePublicPlanByIdentifier(identifier: string) {
  const fallbackSlug = getFallbackPublicPlanSlug(identifier);

  if (fallbackSlug) {
    return prisma.plan.findFirst({
      where: {
        slug: fallbackSlug,
        active: true,
      },
    });
  }

  return prisma.plan.findFirst({
    where: {
      active: true,
      OR: [{ id: identifier }, { slug: identifier }],
    },
  });
}

export async function ensureActivePublicPlanForCheckout(identifier: string) {
  const existingPlan = await findActivePublicPlanByIdentifier(identifier);

  if (existingPlan) {
    return existingPlan;
  }

  const fallbackPlan = getDefaultPublicPlanSeedFromIdentifier(identifier);

  if (!fallbackPlan) {
    return null;
  }

  return prisma.plan.upsert({
    where: {
      slug: fallbackPlan.slug,
    },
    update: buildPublicPlanUpdateData(fallbackPlan),
    create: buildPublicPlanCreateData(fallbackPlan),
  });
}
