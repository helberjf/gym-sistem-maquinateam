import Link from 'next/link';
import { BRAND } from '@/lib/constants/brand';

const sidebarLinks = [
  { href: '/dashboard', label: '🏠 Painel', badge: null },
  { href: '/dashboard/checkins', label: '✅ Check-ins', badge: null },
  { href: '/dashboard/plano', label: '🏷️ Meu Plano', badge: null },
  { href: '/dashboard/pagamentos', label: '💳 Pagamentos', badge: null },
  { href: '/dashboard/relatorios', label: '📊 Relatórios', badge: 'ADM' },
];

/**
 * Layout do Dashboard — protegido por autenticação (Fase 2).
 * Por ora exposto sem guarda de rota.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-brand-black">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-brand-gray-dark border-r border-brand-gray-mid py-6 px-4 gap-1 shrink-0">
        <Link href="/home" className="font-bold text-white text-sm mb-6 px-2">
          {BRAND.name}
        </Link>
        {sidebarLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-brand-gray-light hover:text-white hover:bg-brand-gray-mid transition-colors"
          >
            <span>{link.label}</span>
            {link.badge && (
              <span className="text-xs bg-brand-red text-white px-1.5 py-0.5 rounded">
                {link.badge}
              </span>
            )}
          </Link>
        ))}

        {/* placeholder logout */}
        <div className="mt-auto">
          <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-brand-gray-light hover:text-white hover:bg-brand-gray-mid transition-colors">
            🚪 Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 p-6 md:p-8 overflow-auto">{children}</main>
    </div>
  );
}
