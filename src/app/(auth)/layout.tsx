import Link from 'next/link';
import Image from 'next/image';
import { BRAND } from '@/lib/constants/brand';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-black flex flex-col">
      {/* Header mínimo */}
      <header className="px-6 py-4 border-b border-brand-gray-mid">
        <Link href="/home" className="flex items-center gap-2 w-fit">
          <Image
            src="/images/logo.jpg"
            alt={BRAND.name}
            width={36}
            height={36}
            className="rounded-full object-cover"
          />
          <span className="font-bold text-white text-sm">{BRAND.name}</span>
        </Link>
      </header>

      {/* Conteúdo centralizado */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="py-4 text-center text-xs text-brand-gray-light">
        © {new Date().getFullYear()} {BRAND.name}
      </footer>
    </div>
  );
}
