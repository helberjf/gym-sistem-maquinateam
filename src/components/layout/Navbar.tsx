import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { BRAND } from "@/lib/constants/brand";
import { Button } from "@/components/ui/Button";

export async function Navbar() {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user?.id);

  const links = [
    { href: "/home", label: "Home" },
    { href: "/planos", label: "Planos" },
    { href: "/contato", label: "Contato" },
    { href: "/faq", label: "FAQ" },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-brand-gray-mid bg-brand-black/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/home" className="flex min-w-0 items-center gap-3">
          <Image
            src="/images/logo.jpg"
            alt={`${BRAND.name} logo`}
            width={46}
            height={46}
            className="rounded-full border border-brand-gray-mid object-cover"
          />
          <div className="min-w-0">
            <span className="block truncate text-xl font-bold uppercase tracking-[0.14em] text-white">
              {BRAND.name}
            </span>
            <span className="block truncate text-[11px] uppercase tracking-[0.24em] text-brand-gray-light">
              Premium fight club
            </span>
          </div>
        </Link>

        <ul className="hidden items-center gap-6 lg:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium text-brand-gray-light hover:text-white"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href={isAuthenticated ? "/dashboard" : "/login"}>
              {isAuthenticated ? "Dashboard" : "Login"}
            </Link>
          </Button>
          {!isAuthenticated ? (
            <Button asChild size="sm">
              <Link href="/cadastro">Cadastrar</Link>
            </Button>
          ) : null}
        </div>

        <details className="group relative lg:hidden">
          <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border border-brand-gray-mid bg-brand-gray-dark text-white">
            <span className="text-lg">+</span>
          </summary>
          <div className="absolute right-0 mt-3 w-72 rounded-3xl border border-brand-gray-mid bg-brand-black/95 p-4 shadow-2xl">
            <div className="space-y-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-2xl border border-transparent px-4 py-3 text-sm text-brand-gray-light hover:border-brand-gray-mid hover:bg-brand-gray-dark hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <Link
                href={isAuthenticated ? "/dashboard" : "/login"}
                className="rounded-2xl border border-brand-gray-mid px-4 py-3 text-center text-sm font-semibold text-white"
              >
                {isAuthenticated ? "Abrir dashboard" : "Entrar"}
              </Link>
              {!isAuthenticated ? (
                <Link
                  href="/cadastro"
                  className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-black"
                >
                  Criar conta
                </Link>
              ) : null}
            </div>
          </div>
        </details>
      </nav>
    </header>
  );
}
