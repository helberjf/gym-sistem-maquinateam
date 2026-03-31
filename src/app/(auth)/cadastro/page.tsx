import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cadastro — Novo Aluno',
};

/**
 * Página de cadastro — placeholder para Fase 2.
 * Implementação real: React Hook Form + Zod + Server Action + bcryptjs.
 */
export default function CadastroPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-white">Criar Conta</h1>
        <p className="text-brand-gray-light text-sm mt-1">
          Registre-se para acessar o painel do aluno
        </p>
      </div>

      {/* TODO: Fase 2 — formulário real com validação Zod + Server Action */}
      <div className="bg-brand-gray-dark border border-brand-gray-mid rounded-2xl p-8 space-y-4">
        {['Nome completo', 'E-mail', 'Telefone', 'Senha', 'Confirmar senha'].map((field) => (
          <div key={field} className="space-y-1">
            <label className="block text-sm text-brand-gray-light">{field}</label>
            <input
              type={field.toLowerCase().includes('senha') ? 'password' : 'text'}
              placeholder="..."
              disabled
              className="w-full px-4 py-2.5 rounded-lg bg-brand-black border border-brand-gray-mid text-white text-sm placeholder:text-brand-gray-light/50 disabled:opacity-50 cursor-not-allowed"
            />
          </div>
        ))}

        <div className="pt-2">
          <button
            disabled
            className="w-full py-2.5 rounded-lg bg-brand-red text-white font-medium text-sm disabled:opacity-50 cursor-not-allowed"
          >
            Criar conta
          </button>
        </div>

        <p className="text-center text-xs text-brand-gray-light pt-2">
          🚧 Cadastro disponível na Fase 2
        </p>
      </div>

      <p className="text-center text-sm text-brand-gray-light mt-6">
        Já tem conta?{' '}
        <Link href="/login" className="text-brand-red hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
