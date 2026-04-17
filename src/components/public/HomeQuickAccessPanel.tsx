"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { usePublicViewer } from "@/components/public/usePublicViewer";

export function HomeQuickAccessPanel() {
  const viewer = usePublicViewer();
  const isAuthenticated = viewer.isAuthenticated;

  return (
    <div className="rounded-[1.75rem] border border-black/10 bg-black p-4 text-white shadow-[0_18px_45px_rgba(0,0,0,0.18)] sm:p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-white/55">
        Acesso rapido
      </p>
      <p className="mt-3 text-sm leading-6 text-white/72">
        Entre para continuar sua rotina ou crie a conta para liberar planos,
        produtos e painel do aluno.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        <Button
          asChild
          size="lg"
          className="w-full rounded-2xl bg-brand-red text-black hover:bg-brand-red-dark"
        >
          <Link href={isAuthenticated ? "/dashboard" : "/login"}>
            {isAuthenticated ? "Acessar dashboard" : "Entrar"}
          </Link>
        </Button>
        {!isAuthenticated ? (
          <Link
            href="/cadastro"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-black bg-black px-6 py-3 text-base font-medium text-white transition hover:bg-neutral-800"
          >
            Criar conta
          </Link>
        ) : (
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="w-full rounded-2xl border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/planos">Ver planos</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
