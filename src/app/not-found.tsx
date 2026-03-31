import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl rounded-[2rem] border border-brand-gray-mid bg-brand-gray-dark p-8 text-center shadow-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-gray-light">
          404
        </p>
        <h1 className="mt-4 text-4xl font-bold text-white">
          Pagina nao encontrada
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-brand-gray-light">
          O caminho acessado nao existe mais ou foi movido. Use os atalhos
          abaixo para voltar ao site publico ou ao painel.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/home">Ir para o site</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard">Ir para o dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
