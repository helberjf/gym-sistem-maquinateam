import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Login — Área do Aluno',
};

/**
 * Página de login — placeholder para Fase 2.
 * A autenticação real será implementada com Auth.js v5.
 */
export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-white">Área do Aluno</h1>
        <p className="text-brand-gray-light text-sm mt-1">
          Entre com sua conta para acessar o painel
        </p>
      </div>

      {/* TODO: Fase 2 — formulário real com React Hook Form + Zod + Auth.js */}
      <div className="bg-brand-gray-dark border border-brand-gray-mid rounded-2xl p-8 space-y-4">
        <div className="space-y-1">
          <label className="block text-sm text-brand-gray-light" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            placeholder="seu@email.com"
            disabled
            className="w-full px-4 py-2.5 rounded-lg bg-brand-black border border-brand-gray-mid text-white text-sm placeholder:text-brand-gray-light/50 disabled:opacity-50 cursor-not-allowed"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm text-brand-gray-light" htmlFor="password">
            Senha
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            disabled
            className="w-full px-4 py-2.5 rounded-lg bg-brand-black border border-brand-gray-mid text-white text-sm placeholder:text-brand-gray-light/50 disabled:opacity-50 cursor-not-allowed"
          />
        </div>

        <div className="pt-2">
          <button
            disabled
            className="w-full py-2.5 rounded-lg bg-brand-red text-white font-medium text-sm disabled:opacity-50 cursor-not-allowed"
          >
            Entrar
          </button>
        </div>

        <p className="text-center text-xs text-brand-gray-light pt-2">
          🚧 Autenticação disponível na Fase 2
        </p>
      </div>

      <p className="text-center text-sm text-brand-gray-light mt-6">
        Não tem conta?{' '}
        <Link href="/cadastro" className="text-brand-red hover:underline">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
