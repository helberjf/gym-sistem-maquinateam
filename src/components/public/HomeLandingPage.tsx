import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Dumbbell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/public/SectionHeading";
import { StoreProductCard } from "@/components/store/StoreProductCard";
import { formatCurrencyFromCents } from "@/lib/billing/constants";
import type { PublicPlanCatalogItem } from "@/lib/billing/public";
import type { StoreCatalogProductCard } from "@/lib/store/catalog";
import { BRAND } from "@/lib/constants/brand";

const stats = [
  { label: "Modalidades", value: String(BRAND.modalities.length) },
  { label: "Horario", value: "08h - 22h" },
  { label: "Cidade", value: "JF - MG" },
  { label: "Foco", value: "Performance" },
];

function HomePlanPreviewCard({ plan }: { plan: PublicPlanCatalogItem }) {
  const isPrimary = plan.isRecommended;
  const accentBadge = plan.isRecommended ? "RECOMENDADO" : plan.badge;

  return (
    <article
      className={[
        "flex h-full flex-col rounded-[2rem] border p-5",
        isPrimary
          ? "border-[#e2b34d] bg-[linear-gradient(180deg,#fff6d9_0%,#ffffff_45%)] text-black shadow-[0_20px_80px_rgba(226,179,77,0.18)]"
          : "border-brand-gray-mid bg-brand-black/40 text-white",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={[
              "text-xs uppercase tracking-[0.24em]",
              isPrimary ? "text-black/60" : "text-brand-gray-light",
            ].join(" ")}
          >
            {plan.periodLabel}
          </p>
          <h3 className="mt-3 text-2xl font-bold uppercase sm:text-3xl">
            {plan.name}
          </h3>
        </div>
        {accentBadge ? (
          <span
            className={[
              "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
              isPrimary
                ? "bg-black text-white"
                : "border border-brand-gray-mid text-brand-gray-light",
            ].join(" ")}
          >
            {accentBadge}
          </span>
        ) : null}
      </div>

      <p
        className={[
          "mt-4 text-sm leading-6",
          isPrimary ? "text-black/70" : "text-brand-gray-light",
        ].join(" ")}
      >
        {plan.description ??
          "Plano ativo para acompanhar treinos, pagamentos e evolucao no sistema da academia."}
      </p>

      <div className="mt-6">
        <p className="text-xs uppercase tracking-[0.24em] opacity-70">
          {plan.isUnlimited
            ? "Qualquer dia e horario"
            : `${plan.sessionsPerWeek ?? 0} treino(s) por semana`}
        </p>
        <p className="mt-2 text-4xl font-bold leading-none">
          {formatCurrencyFromCents(plan.monthlyEquivalentCents)}
        </p>
        <p className="mt-2 text-sm opacity-70">
          {plan.billingIntervalMonths > 1
            ? `cobranca de ${formatCurrencyFromCents(plan.priceCents)} pelo periodo`
            : "por mes"}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(plan.benefits ?? []).slice(0, 2).map((benefit) => (
          <span
            key={benefit}
            className={[
              "rounded-full px-3 py-2 text-xs",
              isPrimary
                ? "border border-black/10 bg-black/[0.04] text-black/75"
                : "border border-brand-gray-mid bg-brand-black/40 text-brand-gray-light",
            ].join(" ")}
          >
            {benefit}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-6">
        <Button
          asChild
          className={[
            "w-full",
            isPrimary ? "bg-black text-white hover:bg-black/90" : "",
          ].join(" ")}
        >
          <Link href="/planos">Ver plano</Link>
        </Button>
      </div>
    </article>
  );
}

type HomeLandingPageProps = {
  featuredPlans: PublicPlanCatalogItem[];
  featuredProducts: StoreCatalogProductCard[];
  isAuthenticated: boolean;
};

export function HomeLandingPage({
  featuredPlans,
  featuredProducts,
  isAuthenticated,
}: HomeLandingPageProps) {
  return (
    <div className="bg-brand-black">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-brand-gray-mid">
        <div className="absolute inset-0">
          <Image
            src="/images/fachada.webp"
            alt={BRAND.name}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-25 grayscale"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.55),#050505)]" />
        </div>

        <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-7xl flex-col items-center justify-center gap-8 px-4 py-16 text-center sm:min-h-[calc(100vh-4.5rem)] sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.34em] text-brand-gray-light">
            Academia de luta premium
          </p>
          <h1 className="max-w-4xl text-[clamp(3rem,12vw,5rem)] font-bold uppercase leading-[0.9] text-white sm:text-7xl lg:text-8xl">
            {BRAND.name}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-brand-gray-light sm:text-lg sm:leading-8">
            {BRAND.slogan}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full gap-2 sm:w-auto">
              <Link href="/products">
                <ShoppingBag className="h-5 w-5" />
                Ver produtos
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="w-full gap-2 sm:w-auto">
              <Link href="/planos">
                <Dumbbell className="h-5 w-5" />
                Ver planos
              </Link>
            </Button>
          </div>

          <div className="mt-4 grid w-full max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((item) => (
              <div
                key={item.label}
                className="min-w-0 rounded-2xl border border-brand-gray-mid bg-brand-black/60 p-3 backdrop-blur sm:p-4"
              >
                <p className="text-[10px] uppercase tracking-[0.24em] text-brand-gray-light sm:text-xs">
                  {item.label}
                </p>
                <p className="mt-2 whitespace-nowrap text-[clamp(0.72rem,3vw,0.95rem)] font-bold leading-tight tracking-tight text-white sm:text-2xl">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUTOS EM DESTAQUE */}
      {featuredProducts.length > 0 ? (
        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Loja"
              title="Produtos em destaque"
              description="Equipamentos, vestuario e acessorios selecionados para a rotina da Maquina Team."
            />
            <Button asChild variant="secondary" className="hidden gap-2 sm:inline-flex">
              <Link href="/products">
                Ver todos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <StoreProductCard
                key={product.id}
                product={product}
                interactiveEnabled={true}
              />
            ))}
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Button asChild variant="secondary" className="w-full gap-2">
              <Link href="/products">
                Ver todos os produtos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      ) : null}

      {/* MODALIDADES */}
      <section className="border-y border-brand-gray-mid bg-brand-gray-dark/60">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 sm:gap-10 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:px-8">
          <div className="mx-auto w-full max-w-xl overflow-hidden rounded-[2rem] border border-brand-gray-mid lg:max-w-none">
            <div className="relative aspect-[5/4] sm:aspect-[4/3]">
              <Image
                src="/images/interior.webp"
                alt="Interior da academia"
                fill
                sizes="(min-width: 1024px) 38vw, (min-width: 640px) 80vw, calc(100vw - 2rem)"
                className="object-cover grayscale"
              />
            </div>
          </div>

          <div>
            <SectionHeading
              eyebrow="Modalidades"
              title="Rotina completa para luta"
              description="Do primeiro treino ao ritmo de atleta, a grade foi pensada para encaixar tecnica, cardio, forca e consistencia."
            />

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {BRAND.modalities.map((modality) => (
                <div
                  key={modality}
                  className="rounded-[2rem] border border-brand-gray-mid bg-brand-black/50 p-5"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-brand-gray-light">
                    modalidade
                  </p>
                  <p className="mt-3 text-2xl font-bold uppercase text-white sm:text-3xl">
                    {modality}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <SectionHeading
            eyebrow="Planos"
            title="Escolha o ritmo"
            description="Planos claros, premium e diretos. Entre pelo nivel de frequencia que cabe na sua rotina."
          />
          <Button asChild variant="secondary" className="hidden sm:inline-flex">
            <Link href="/planos">Ver tabela completa</Link>
          </Button>
        </div>

        {featuredPlans.length === 0 ? (
          <div className="mt-10 rounded-[2rem] border border-brand-gray-mid bg-brand-gray-dark p-6">
            <p className="text-sm text-brand-gray-light">
              Os planos publicos estao sendo sincronizados. Enquanto isso, a equipe
              comercial segue atendendo rapido pelo WhatsApp.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-5 xl:grid-cols-3">
            {featuredPlans.map((plan) => (
              <HomePlanPreviewCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}
      </section>

      {/* DEPOIMENTOS */}
      <section className="border-y border-brand-gray-mid bg-brand-gray-dark/60">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <SectionHeading
            eyebrow="Depoimentos"
            title="Quem treina sente a diferenca"
            description="Feedback real de quem ja entrou na rotina da Maquina Team."
            align="center"
          />

          <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {BRAND.reviews.map((review) => (
              <article
                key={review.author}
                className="rounded-[2rem] border border-brand-gray-mid bg-brand-black/50 p-6"
              >
                <div className="mb-3 flex gap-1">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-base leading-7 text-brand-gray-light">
                  &ldquo;{review.text}&rdquo;
                </p>
                <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-white">
                  {review.author}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_28%),linear-gradient(135deg,#0a0a0a,#161616)] p-1 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
          <div className="grid gap-8 rounded-[2.2rem] bg-white px-6 py-8 text-black sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end lg:px-10">
            <div>
              <span className="inline-flex rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-black/65">
                Comece agora
              </span>
              <h2 className="mt-4 max-w-3xl text-3xl font-bold uppercase leading-[0.92] sm:text-5xl">
                Entre no sistema e evolua
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-black/70 sm:text-base">
                Crie sua conta, escolha um plano, acompanhe treinos, compre na loja e
                faca parte da comunidade Maquina Team.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {["Planos online", "Loja integrada", "Treinos no app"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-2 text-xs font-medium text-black/70"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-black/10 bg-black p-4 text-white shadow-[0_18px_45px_rgba(0,0,0,0.18)] sm:p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-white/55">
                Acesso rapido
              </p>
              <p className="mt-3 text-sm leading-6 text-white/72">
                Entre para continuar sua rotina ou crie a conta para liberar planos,
                produtos e painel do aluno.
              </p>

              <div className="mt-5 flex flex-col gap-3">
                <Button
                  asChild
                  size="lg"
                  className="w-full rounded-2xl bg-brand-red text-black hover:bg-brand-red-dark"
                >
                  <Link href={isAuthenticated ? "/dashboard" : "/login"}>
                    {isAuthenticated ? "Acessar dashboard" : "Entrar"}
                  </Link>
                </Button>
                {!isAuthenticated ? (
                  <Link
                    href="/cadastro"
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-black bg-black px-6 py-3 text-base font-medium text-white transition hover:bg-neutral-800"
                  >
                    Criar conta
                  </Link>
                ) : (
                  <Button
                    asChild
                    size="lg"
                    variant="secondary"
                    className="w-full rounded-2xl border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    <Link href="/planos">Ver planos</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
