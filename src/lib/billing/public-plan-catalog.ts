export type PublicPlanCatalogSeed = {
  slug: string;
  name: string;
  description: string;
  benefits: readonly string[];
  priceCents: number;
  billingIntervalMonths: number;
  durationMonths: number | null;
  sessionsPerWeek: number | null;
  isUnlimited: boolean;
  enrollmentFeeCents: number;
};

export const DEFAULT_PUBLIC_PLAN_CATALOG = [
  {
    slug: "mensal-1x-na-semana",
    name: "Mensal 1x na Semana",
    description: "Plano mensal para manter constancia com uma aula por semana.",
    benefits: [
      "1 treino por semana",
      "Acesso ao app do aluno",
      "Acompanhamento basico da equipe",
    ],
    priceCents: 12900,
    billingIntervalMonths: 1,
    durationMonths: 1,
    sessionsPerWeek: 1,
    isUnlimited: false,
    enrollmentFeeCents: 0,
  },
  {
    slug: "mensal-2x-na-semana",
    name: "Mensal 2x na Semana",
    description:
      "Plano mensal para evoluir tecnica e condicionamento com duas aulas por semana.",
    benefits: [
      "2 treinos por semana",
      "App com historico e pagamentos",
      "Rotina forte de evolucao",
    ],
    priceCents: 15900,
    billingIntervalMonths: 1,
    durationMonths: 1,
    sessionsPerWeek: 2,
    isUnlimited: false,
    enrollmentFeeCents: 0,
  },
  {
    slug: "mensal-3x-na-semana",
    name: "Mensal 3x na Semana",
    description:
      "Plano mensal para acelerar a evolucao com tres aulas por semana.",
    benefits: [
      "3 treinos por semana",
      "Melhor custo-beneficio do mensal",
      "Mais intensidade na rotina",
    ],
    priceCents: 17900,
    billingIntervalMonths: 1,
    durationMonths: 1,
    sessionsPerWeek: 3,
    isUnlimited: false,
    enrollmentFeeCents: 0,
  },
  {
    slug: "semestral-1x-na-semana",
    name: "Semestral 1x na Semana",
    description: "Plano de 6 meses para manter constancia com economia mensal.",
    benefits: [
      "1 treino por semana",
      "Total de R$ 714,00 no periodo",
      "Melhor valor que o mensal",
    ],
    priceCents: 71400,
    billingIntervalMonths: 6,
    durationMonths: 6,
    sessionsPerWeek: 1,
    isUnlimited: false,
    enrollmentFeeCents: 0,
  },
  {
    slug: "semestral-2x-na-semana",
    name: "Semestral 2x na Semana",
    description:
      "Plano de 6 meses para manter ritmo forte e previsibilidade.",
    benefits: [
      "2 treinos por semana",
      "Total de R$ 858,00 no periodo",
      "Compromisso de medio prazo",
    ],
    priceCents: 85800,
    billingIntervalMonths: 6,
    durationMonths: 6,
    sessionsPerWeek: 2,
    isUnlimited: false,
    enrollmentFeeCents: 0,
  },
  {
    slug: "semestral-3x-na-semana",
    name: "Semestral 3x na Semana",
    description:
      "Plano de 6 meses para quem quer treinar serio e colher resultado.",
    benefits: [
      "3 treinos por semana",
      "Total de R$ 978,00 no periodo",
      "Ritmo forte de evolucao",
    ],
    priceCents: 97800,
    billingIntervalMonths: 6,
    durationMonths: 6,
    sessionsPerWeek: 3,
    isUnlimited: false,
    enrollmentFeeCents: 0,
  },
  {
    slug: "anual-1x-na-semana",
    name: "Anual 1x na Semana",
    description:
      "Plano anual com a menor mensalidade da grade para manter constancia.",
    benefits: [
      "1 treino por semana",
      "Total de R$ 1.308,00 no periodo",
      "Maior economia no longo prazo",
    ],
    priceCents: 130800,
    billingIntervalMonths: 12,
    durationMonths: 12,
    sessionsPerWeek: 1,
    isUnlimited: false,
    enrollmentFeeCents: 0,
  },
  {
    slug: "anual-2x-na-semana",
    name: "Anual 2x na Semana",
    description:
      "Plano anual equilibrado para tecnica, cardio e consistencia.",
    benefits: [
      "2 treinos por semana",
      "Total de R$ 1.428,00 no periodo",
      "Valor mensal mais competitivo",
    ],
    priceCents: 142800,
    billingIntervalMonths: 12,
    durationMonths: 12,
    sessionsPerWeek: 2,
    isUnlimited: false,
    enrollmentFeeCents: 0,
  },
  {
    slug: "anual-3x-na-semana",
    name: "Anual 3x na Semana",
    description:
      "Plano anual premium para acelerar evolucao com a melhor relacao custo-frequencia.",
    benefits: [
      "3 treinos por semana",
      "Total de R$ 1.788,00 no periodo",
      "Plano premium da grade publica",
    ],
    priceCents: 178800,
    billingIntervalMonths: 12,
    durationMonths: 12,
    sessionsPerWeek: 3,
    isUnlimited: false,
    enrollmentFeeCents: 0,
  },
  {
    slug: "plano-full",
    name: "Plano Full",
    description:
      "Qualquer dia e qualquer horario para quem quer viver a rotina completa da academia.",
    benefits: [
      "Treinos ilimitados",
      "Qualquer dia e qualquer horario",
      "Acesso completo a uma arte marcial",
    ],
    priceCents: 25000,
    billingIntervalMonths: 1,
    durationMonths: 1,
    sessionsPerWeek: null,
    isUnlimited: true,
    enrollmentFeeCents: 0,
  },
  {
    slug: "plano-full-desconto-social",
    name: "Plano Full Desconto Social",
    description:
      "Siga nossos perfis, avalie a academia e consulte a equipe antes de contratar essa condicao especial.",
    benefits: [
      "Treinos ilimitados",
      "Condicao social especial",
      "Consulte a equipe antes de contratar",
    ],
    priceCents: 18500,
    billingIntervalMonths: 1,
    durationMonths: 1,
    sessionsPerWeek: null,
    isUnlimited: true,
    enrollmentFeeCents: 0,
  },
] satisfies readonly PublicPlanCatalogSeed[];
