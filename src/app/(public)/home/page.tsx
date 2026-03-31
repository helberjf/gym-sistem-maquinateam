import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PublicPlanCard } from "@/components/public/PublicPlanCard";
import { SectionHeading } from "@/components/public/SectionHeading";
import { BRAND } from "@/lib/constants/brand";
import { groupPlansByPeriod } from "@/lib/constants/plans";

export const metadata: Metadata = {
  title: "Home",
  description: "Site oficial da Maquina Team com planos, contato, FAQ e acesso ao sistema.",
};

const featuredPlans = groupPlansByPeriod().monthly.slice(0, 3);

const stats = [
  { label: "Modalidades", value: String(BRAND.modalities.length) },
  { label: "Horario", value: "08h - 22h" },
  { label: "Cidade", value: "JF - MG" },
  { label: "Foco", value: "Performance" },
];

export default function HomePage() {
  return (
    <div className="bg-brand-black">
      <section className="relative overflow-hidden border-b border-brand-gray-mid">
        <div className="absolute inset-0">
          <Image
            src="/images/fachada.webp"
            alt={BRAND.name}
            fill
            priority
            className="object-cover opacity-25 grayscale"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.55),#050505)]" />
        </div>

        <div className="relative mx-auto grid min-h-[calc(100vh-4.5rem)] w-full max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.34em] text-brand-gray-light">
              Academia de luta premium
            </p>
            <h1 className="mt-5 max-w-4xl text-6xl font-bold uppercase leading-[0.9] text-white sm:text-7xl lg:text-8xl">
              {BRAND.name}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-brand-gray-light">
              {BRAND.slogan} Boxe, muay thai, kickboxing e funcional em um
              ambiente forte, clean e pronto para quem quer evolucao de verdade.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/cadastro">Criar conta</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/planos">Ver planos</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <a
                  href={BRAND.contact.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-brand-gray-mid bg-brand-black/60 p-4 backdrop-blur"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-brand-gray-light">
                    {item.label}
                  </p>
                  <p className="mt-3 text-2xl font-bold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="overflow-hidden rounded-[2rem] border border-brand-gray-mid bg-brand-gray-dark shadow-2xl">
              <div className="relative aspect-[4/5]">
                <Image
                  src="/images/instrutor.jpg"
                  alt={BRAND.instructor}
                  fill
                  className="object-cover grayscale"
                />
              </div>
              <div className="border-t border-brand-gray-mid p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-brand-gray-light">
                  Lideranca tecnica
                </p>
                <h2 className="mt-3 text-3xl font-bold uppercase text-white">
                  {BRAND.instructor}
                </h2>
                <p className="mt-3 text-sm leading-6 text-brand-gray-light">
                  Base tecnica, disciplina de treino e uma experiencia de
                  academia voltada para constancia, resultado e alto padrao.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Diferenciais"
          title="Treino com identidade"
          description="A Maquina Team combina tecnica, disciplina e ambiente premium. O resultado e uma academia enxuta, forte e focada no que realmente importa: evolucao consistente."
        />

        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {BRAND.highlights.map((item) => (
            <article
              key={item}
              className="rounded-[2rem] border border-brand-gray-mid bg-brand-gray-dark p-6"
            >
              <p className="text-sm uppercase tracking-[0.24em] text-brand-gray-light">
                destaque
              </p>
              <p className="mt-4 text-2xl font-bold uppercase text-white">{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-brand-gray-mid bg-brand-gray-dark/60">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div className="overflow-hidden rounded-[2rem] border border-brand-gray-mid">
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/interior.webp"
                alt="Interior da academia"
                fill
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
                  <p className="mt-3 text-3xl font-bold uppercase text-white">
                    {modality}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/planos">Escolher plano</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/contato">Falar com a academia</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Planos"
            title="Escolha o ritmo"
            description="Planos claros, premium e diretos. Entre pelo nivel de frequencia que cabe na sua rotina hoje."
          />
          <Button asChild variant="secondary" className="hidden sm:inline-flex">
            <Link href="/planos">Ver tabela completa</Link>
          </Button>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 xl:grid-cols-3">
          {featuredPlans.map((plan) => (
            <PublicPlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </section>

      <section className="border-y border-brand-gray-mid bg-brand-gray-dark/60">
        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Prova social"
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
                <p className="text-base leading-7 text-brand-gray-light">
                  "{review.text}"
                </p>
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white">
                    {review.author}
                  </p>
                  <p className="text-xs uppercase tracking-[0.24em] text-brand-gray-light">
                    {review.rating}/5
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] border border-brand-gray-mid bg-white px-6 py-10 text-black shadow-[0_20px_80px_rgba(255,255,255,0.06)] sm:px-10">
          <p className="text-xs uppercase tracking-[0.32em] text-black/55">
            Entre agora
          </p>
          <h2 className="mt-4 text-5xl font-bold uppercase leading-none">
            Site publico e sistema conectados
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-black/70 sm:text-base">
            Conheca a academia, fale com a equipe, crie sua conta, acompanhe
            treinos, pagamentos, presenca e toda a jornada dentro do sistema.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/cadastro">Criar conta</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <a
                href={BRAND.contact.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
