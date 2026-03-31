import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BRAND } from '@/lib/constants/brand';
import { PLANS } from '@/lib/constants/plans';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Início',
};

// ---------- Seção Hero ----------
function HeroSection() {
  return (
    <section
      id="home"
      className="relative bg-brand-black overflow-hidden"
    >
      {/* Imagem de fundo */}
      <div className="absolute inset-0">
        <Image
          src="/images/fachada.webp"
          alt="Maquina Team"
          fill
          priority
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-black/60 via-brand-black/40 to-brand-black" />
      </div>

      <div className="relative container mx-auto px-4 py-32 text-center">
        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4">
          {BRAND.name}
        </h1>
        <p className="text-xl md:text-2xl text-brand-red font-semibold mb-6">
          {BRAND.slogan}
        </p>
        <p className="text-brand-gray-light text-base md:text-lg max-w-xl mx-auto mb-8">
          Academia de luta com {BRAND.modalities.join(', ')} em{' '}
          {BRAND.address.city}.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="#planos">Ver Planos</Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <a
              href={BRAND.contact.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Falar no WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ---------- Seção Planos (preview) ----------
function PlansSection() {
  const monthlyPlans = PLANS.filter((p) => p.period === 'MONTHLY');

  return (
    <section id="planos" className="py-20 bg-brand-gray-dark">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
            Nossos Planos
          </h2>
          <p className="text-brand-gray-light">
            Escolha o ideal para você!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {monthlyPlans.map((plan) => (
            <div
              key={plan.id}
              className={[
                'rounded-2xl p-6 border flex flex-col items-center text-center',
                plan.featured
                  ? 'border-brand-red bg-brand-red/10'
                  : 'border-brand-gray-mid bg-brand-black',
              ].join(' ')}
            >
              {plan.badge && (
                <span className="mb-3 inline-block text-xs font-bold px-3 py-1 rounded-full bg-brand-red text-white">
                  {plan.badge}
                </span>
              )}
              <p className="text-brand-gray-light text-sm mb-1">{plan.frequency} por semana</p>
              <p className="text-3xl font-black text-white">
                R${' '}
                {plan.totalPrice.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-brand-gray-light mt-1">/mês</p>
              <Button className="mt-6 w-full" variant={plan.featured ? 'primary' : 'secondary'}>
                Contratar
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-brand-gray-light text-sm mt-8">
          Também temos planos semestrais, anuais e Full.{' '}
          {/* TODO: Fase 2 — página completa de planos */}
        </p>
      </div>
    </section>
  );
}

// ---------- Seção Contato ----------
function ContactSection() {
  return (
    <section id="contatos" className="py-20 bg-brand-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
            Entre em Contato
          </h2>
          <p className="text-brand-gray-light">
            Venha conhecer a Maquina Team e comece sua transformação hoje mesmo!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            { icon: '📍', label: 'Endereço', value: BRAND.address.full },
            { icon: '📞', label: 'Telefone', value: BRAND.contact.phone },
            { icon: '✉️', label: 'E-mail', value: BRAND.contact.email },
            { icon: '🕐', label: 'Horário', value: BRAND.hours.label },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-brand-gray-dark rounded-2xl p-6 border border-brand-gray-mid text-center"
            >
              <div className="text-2xl mb-3">{item.icon}</div>
              <h4 className="text-sm font-semibold text-white mb-1">
                {item.label}
              </h4>
              <p className="text-xs text-brand-gray-light">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          <Button size="lg" asChild>
            <a
              href={BRAND.contact.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Falar no WhatsApp
            </a>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <a
              href={BRAND.contact.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram {BRAND.contact.instagram}
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ---------- Page ----------
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PlansSection />
      <ContactSection />
    </>
  );
}
