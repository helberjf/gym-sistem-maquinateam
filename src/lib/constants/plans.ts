// ============================================================
// Planos e preços — Maquina Team
// Migrado do legado: api/index.js → PLAN_PRICES map + index.html
// ============================================================

import type { Plan } from '@/types';

export const PLANS: Plan[] = [
  // --- MENSAL ---
  {
    id: 'plan_1',
    name: 'Mensal 1x',
    period: 'MONTHLY',
    frequency: '1x',
    priceMonthly: 129.0,
    totalPrice: 129.0,
  },
  {
    id: 'plan_2',
    name: 'Mensal 2x',
    period: 'MONTHLY',
    frequency: '2x',
    priceMonthly: 159.0,
    totalPrice: 159.0,
  },
  {
    id: 'plan_3',
    name: 'Mensal 3x',
    period: 'MONTHLY',
    frequency: '3x',
    priceMonthly: 179.0,
    totalPrice: 179.0,
    featured: true,
    badge: 'MAIS POPULAR',
  },

  // --- SEMESTRAL ---
  {
    id: 'plan_4',
    name: 'Semestral 1x',
    period: 'SEMIANNUAL',
    frequency: '1x',
    priceMonthly: 119.0,
    totalPrice: 714.0,
  },
  {
    id: 'plan_5',
    name: 'Semestral 2x',
    period: 'SEMIANNUAL',
    frequency: '2x',
    priceMonthly: 143.0,
    totalPrice: 858.0,
  },
  {
    id: 'plan_6',
    name: 'Semestral 3x',
    period: 'SEMIANNUAL',
    frequency: '3x',
    priceMonthly: 163.0,
    totalPrice: 978.0,
    featured: true,
    badge: 'MAIS POPULAR',
  },

  // --- ANUAL ---
  {
    id: 'plan_7',
    name: 'Anual 1x',
    period: 'ANNUAL',
    frequency: '1x',
    priceMonthly: 109.0,
    totalPrice: 1308.0,
  },
  {
    id: 'plan_8',
    name: 'Anual 2x',
    period: 'ANNUAL',
    frequency: '2x',
    priceMonthly: 119.0,
    totalPrice: 1428.0,
  },
  {
    id: 'plan_9',
    name: 'Anual 3x',
    period: 'ANNUAL',
    frequency: '3x',
    priceMonthly: 149.0,
    totalPrice: 1788.0,
    featured: true,
    badge: 'MAIS POPULAR',
  },

  // --- FULL ---
  {
    id: 'plan_10',
    name: 'Full — Ilimitado',
    period: 'FULL',
    frequency: 'UNLIMITED',
    priceMonthly: 250.0,
    totalPrice: 250.0,
  },
  {
    id: 'plan_11',
    name: 'Full — Desconto Social',
    period: 'FULL',
    frequency: 'UNLIMITED',
    priceMonthly: 185.0,
    totalPrice: 185.0,
    badge: 'DESCONTO SOCIAL',
  },
];

/** Mapa plano id → preço total (backend-authoritative) */
export const PLAN_PRICES: Record<string, number> = Object.fromEntries(
  PLANS.map((p) => [p.id, p.totalPrice])
);
