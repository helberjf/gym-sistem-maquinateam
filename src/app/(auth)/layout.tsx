import Link from "next/link";
import Image from "next/image";
import { BRAND } from "@/lib/constants/brand";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-black">
      <header className="border-b border-brand-gray-mid bg-brand-black/85 px-6 py-4 backdrop-blur">
        <Link href="/home" className="flex w-fit items-center gap-3">
          <Image
            src="/images/logo.jpg"
            alt={BRAND.name}
            width={40}
            height={40}
            className="rounded-full border border-brand-gray-mid object-cover"
          />
          <div>
            <span className="block text-sm font-bold uppercase tracking-[0.18em] text-white">
              {BRAND.name}
            </span>
            <span className="block text-[11px] uppercase tracking-[0.24em] text-brand-gray-light">
              Acesso seguro
            </span>
          </div>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="py-4 text-center text-xs text-brand-gray-light">
        &copy; {new Date().getFullYear()} {BRAND.name}
      </footer>
    </div>
  );
}
