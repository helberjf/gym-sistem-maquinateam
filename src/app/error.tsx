"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl rounded-[2rem] border border-brand-gray-mid bg-brand-gray-dark p-8 text-center shadow-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-gray-light">
          Erro
        </p>
        <h1 className="mt-4 text-4xl font-bold text-white">
          Algo saiu do previsto
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-brand-gray-light">
          Nao foi possivel concluir esta etapa agora. Voce pode tentar novamente
          ou voltar para uma area segura do sistema.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" onClick={reset}>
            Tentar de novo
          </Button>
          <Button asChild type="button" variant="secondary">
            <Link href="/">Voltar ao inicio</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
