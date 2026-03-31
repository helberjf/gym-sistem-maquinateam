import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Painel — Dashboard',
};

const CARDS = [
  { label: 'Alunos Ativos', value: '—', icon: '👥', note: 'Fase 2' },
  { label: 'Check-ins Hoje', value: '—', icon: '✅', note: 'Fase 4' },
  { label: 'Receita do Mês', value: '—', icon: '💰', note: 'Fase 3' },
  { label: 'Inadimplentes', value: '—', icon: '⚠️', note: 'Fase 3' },
];

/**
 * Dashboard principal — placeholder para as próximas fases.
 * Fase 2: autenticação, dados reais do usuário.
 * Fase 3: pagamentos e receita.
 * Fase 4: check-ins.
 * Fase 5: relatórios.
 */
export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Painel</h1>
        <p className="text-brand-gray-light text-sm mt-1">
          Bem-vindo ao sistema Maquina Team
        </p>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {CARDS.map((card) => (
          <div
            key={card.label}
            className="bg-brand-gray-dark border border-brand-gray-mid rounded-2xl p-5"
          >
            <div className="text-2xl mb-2">{card.icon}</div>
            <p className="text-brand-gray-light text-xs mb-1">{card.label}</p>
            <p className="text-3xl font-black text-white">{card.value}</p>
            <span className="inline-block mt-2 text-xs bg-brand-gray-mid text-brand-gray-light px-2 py-0.5 rounded">
              🚧 {card.note}
            </span>
          </div>
        ))}
      </div>

      {/* Módulos planejados */}
      <div className="bg-brand-gray-dark border border-brand-gray-mid rounded-2xl p-6">
        <h2 className="text-white font-bold mb-4">Módulos planejados</h2>
        <ul className="space-y-2 text-sm text-brand-gray-light">
          <li>✅ <strong className="text-white">Fase 1</strong> — Base arquitetural (atual)</li>
          <li>⏳ <strong className="text-white">Fase 2</strong> — Autenticação (Auth.js v5 + PostgreSQL + Prisma)</li>
          <li>⏳ <strong className="text-white">Fase 3</strong> — Planos, matrículas e pagamentos (Mercado Pago)</li>
          <li>⏳ <strong className="text-white">Fase 4</strong> — Check-in/check-out de alunos</li>
          <li>⏳ <strong className="text-white">Fase 5</strong> — Relatórios e dashboard analytics</li>
          <li>⏳ <strong className="text-white">Fase 6</strong> — Notificações (Mailgun) e upload (Cloudflare R2)</li>
        </ul>
      </div>
    </div>
  );
}
