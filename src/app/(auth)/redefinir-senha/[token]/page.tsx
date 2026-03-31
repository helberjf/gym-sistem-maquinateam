import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { getPasswordResetTokenStatus } from "@/lib/auth/service";

type Params = Promise<{ token: string }>;

export const metadata: Metadata = {
  title: "Redefinir senha",
  description: "Crie uma nova senha usando um token seguro e expiravel.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RedefinirSenhaPage({
  params,
}: {
  params: Params;
}) {
  const { token } = await params;
  const status = await getPasswordResetTokenStatus(token);

  return (
    <AuthCard
      title="Redefinir senha"
      description="Escolha uma nova senha forte para voltar a acessar sua conta."
    >
      {status.ok ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/60 px-4 py-4 text-sm text-brand-gray-light">
            <p className="text-white font-semibold">Conta encontrada</p>
            <p className="mt-2">
              O link esta valido para <strong>{status.email}</strong>.
            </p>
          </div>

          <ResetPasswordForm token={token} />
        </div>
      ) : (
        <div className="space-y-5 text-sm text-brand-gray-light">
          <div className="rounded-2xl border border-brand-gray-light/20 bg-brand-black/70 px-4 py-4 text-brand-white">
            <p className="font-semibold text-base">Link invalido ou expirado.</p>
            <p className="mt-2">{status.message}</p>
          </div>

          <div className="space-y-3">
            <Link
              href="/esqueci-senha"
              className="block w-full rounded-xl bg-brand-red px-4 py-3 text-center font-semibold text-black transition hover:bg-brand-red-dark"
            >
              Solicitar novo link
            </Link>
            <Link
              href="/login"
              className="block text-center text-brand-red hover:underline"
            >
              Voltar para login
            </Link>
          </div>
        </div>
      )}
    </AuthCard>
  );
}
