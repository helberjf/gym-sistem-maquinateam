import Link from "next/link";
import Image from "next/image";
import { BRAND } from "@/lib/constants/brand";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-brand-gray-mid bg-brand-black">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <div className="flex items-center gap-4">
              <Image
                src="/images/logo.jpg"
                alt={BRAND.name}
                width={52}
                height={52}
                className="rounded-full border border-brand-gray-mid object-cover"
              />
              <div>
                <p className="text-xl font-bold uppercase tracking-[0.14em] text-white">
                  {BRAND.name}
                </p>
                <p className="text-xs uppercase tracking-[0.24em] text-brand-gray-light">
                  Fight club
                </p>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm text-brand-gray-light">
              {BRAND.slogan} Estrutura focada em tecnica, condicionamento e uma
              experiencia premium em preto e branco.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
              Navegacao
            </h2>
            <div className="mt-4 space-y-3 text-sm text-brand-gray-light">
              <Link href="/home" className="block hover:text-white">
                Home
              </Link>
              <Link href="/planos" className="block hover:text-white">
                Planos
              </Link>
              <Link href="/contato" className="block hover:text-white">
                Contato
              </Link>
              <Link href="/faq" className="block hover:text-white">
                FAQ
              </Link>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
              Acesso
            </h2>
            <div className="mt-4 space-y-3 text-sm text-brand-gray-light">
              <Link href="/login" className="block hover:text-white">
                Login
              </Link>
              <Link href="/cadastro" className="block hover:text-white">
                Cadastro
              </Link>
              <Link href="/dashboard" className="block hover:text-white">
                Dashboard
              </Link>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
              Contato
            </h2>
            <div className="mt-4 space-y-3 text-sm text-brand-gray-light">
              <p>{BRAND.contact.phone}</p>
              <p>{BRAND.contact.email}</p>
              <a
                href={BRAND.contact.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-white"
              >
                {BRAND.contact.instagram}
              </a>
              <a
                href={BRAND.contact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-white"
              >
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-brand-gray-mid pt-6 text-xs text-brand-gray-light md:flex-row md:items-center md:justify-between">
          <p>
            {new Date().getFullYear()} {BRAND.name}. Todos os direitos reservados.
          </p>
          <p>
            {BRAND.address.full} - {BRAND.hours.label}
          </p>
        </div>
      </div>
    </footer>
  );
}
