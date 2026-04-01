import { PlanCheckoutButton } from "@/components/public/PlanCheckoutButton";
import {
  formatCurrencyFromCents,
  formatMonthsLabel,
  getBillingIntervalLabel,
} from "@/lib/billing/constants";
import type { PublicPlanCatalogItem } from "@/lib/billing/public";

type PublicPlanCardProps = {
  plan: PublicPlanCatalogItem;
  isAuthenticated: boolean;
  callbackUrl?: string;
};

export function PublicPlanCard({
  plan,
  isAuthenticated,
  callbackUrl,
}: PublicPlanCardProps) {
  const recurringLabel = getBillingIntervalLabel(plan.billingIntervalMonths);
  const durationLabel = formatMonthsLabel(
    plan.durationMonths ?? plan.billingIntervalMonths,
  );
  const badgeLabel = plan.isRecommended ? "RECOMENDADO" : plan.badge;
  const isLightSurface = plan.featured || plan.isRecommended;

  return (
    <article
      className={[
        "flex h-full flex-col rounded-[2rem] border p-5 sm:p-6",
        plan.isRecommended
          ? "border-[#e2b34d] bg-[linear-gradient(180deg,#fff6d9_0%,#ffffff_42%)] text-black shadow-[0_20px_80px_rgba(226,179,77,0.18)]"
          : plan.featured
            ? "border-white bg-white text-black shadow-[0_20px_80px_rgba(255,255,255,0.08)]"
            : "border-brand-gray-mid bg-brand-gray-dark text-white",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={[
              "text-xs uppercase tracking-[0.24em]",
              isLightSurface ? "text-black/60" : "text-brand-gray-light",
            ].join(" ")}
          >
            {plan.periodLabel}
          </p>
          <h3 className="mt-3 text-2xl font-bold uppercase sm:text-3xl">
            {plan.name}
          </h3>
        </div>
        {badgeLabel ? (
          <span
            className={[
              "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
              isLightSurface
                ? "bg-black text-white"
                : "border border-brand-gray-mid text-brand-gray-light",
            ].join(" ")}
          >
            {badgeLabel}
          </span>
        ) : null}
      </div>

      <p
        className={[
          "mt-4 text-sm leading-6",
          isLightSurface ? "text-black/70" : "text-brand-gray-light",
        ].join(" ")}
      >
        {plan.description ??
          "Plano ativo para acompanhar treinos, pagamentos e evolucao no sistema da academia."}
      </p>

      <div className="mt-6">
        <p className="text-xs uppercase tracking-[0.24em] opacity-70">
          {plan.isUnlimited
            ? "Acesso livre"
            : plan.sessionsPerWeek
              ? `${plan.sessionsPerWeek} treino(s) por semana`
              : recurringLabel}
        </p>
        <p className="mt-2 text-4xl font-bold leading-none sm:text-5xl">
          {formatCurrencyFromCents(plan.monthlyEquivalentCents)}
        </p>
        <p className="mt-2 text-sm opacity-70">
          {plan.billingIntervalMonths > 1
            ? `equivale a ${formatCurrencyFromCents(plan.monthlyEquivalentCents)} por mes`
            : "por mes"}
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.18em] opacity-70">
          {recurringLabel} | duracao {durationLabel}
        </p>
        <p className="mt-3 text-sm opacity-70">
          Cobranca do periodo: {formatCurrencyFromCents(plan.priceCents)}
          {plan.enrollmentFeeCents > 0
            ? ` + matricula ${formatCurrencyFromCents(plan.enrollmentFeeCents)}`
            : ""}
        </p>
      </div>

      <ul
        className={[
          "mt-6 space-y-3 text-sm",
          isLightSurface ? "text-black/80" : "text-brand-gray-light",
        ].join(" ")}
      >
        {(plan.benefits ?? []).map((benefit) => (
          <li key={benefit} className="flex gap-3">
            <span className={isLightSurface ? "text-black" : "text-white"}>
              +
            </span>
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <PlanCheckoutButton
          planId={plan.id}
          isAuthenticated={isAuthenticated}
          callbackUrl={callbackUrl}
          tone={isLightSurface ? "light" : "dark"}
          className={[
            "w-full",
            isLightSurface ? "bg-black text-white hover:bg-black/90" : "",
          ].join(" ")}
        />
      </div>
    </article>
  );
}
