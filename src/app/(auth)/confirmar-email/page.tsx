import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { consumeVerificationToken } from "@/lib/auth/service";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Confirmar e-mail",
  description: "Confirme seu e-mail para liberar o acesso com credentials.",
  robots: {
    index: false,
    follow: false,
  },
};

function getSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ConfirmarEmailPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const token = getSingleValue(params.token);
  const email = getSingleValue(params.email);
  const sent = getSingleValue(params.sent);
  const callbackUrl = getSingleValue(params.callbackUrl);
  const result = token ? await consumeVerificationToken(token) : null;
  const targetEmail = result && "email" in result ? result.email : email;
  const loginHref = `/login?verified=1${targetEmail ? `&email=${encodeURIComponent(targetEmail)}` : ""}${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`;
  const resendHref = `/reenvio-confirmacao${targetEmail ? `?email=${encodeURIComponent(targetEmail)}` : ""}${callbackUrl ? `${targetEmail ? "&" : "?"}callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`;

  return (
    <AuthCard
      title="Confirmar e-mail"
      description="Valide seu endereco para liberar o login com e-mail e senha."
    >
      <div className="space-y-5 text-sm text-brand-gray-light">
        {result?.ok ? (
          <div className="rounded-2xl border border-brand-white/15 bg-brand-white/5 px-4 py-4 text-brand-white">
            <p className="font-semibold text-base">E-mail confirmado com sucesso.</p>
            <p className="mt-2">
              A conta {targetEmail ? <strong>{targetEmail}</strong> : "informada"} ja
              pode entrar normalmente.
            </p>
          </div>
        ) : token ? (
          <div className="rounded-2xl border border-brand-gray-light/20 bg-brand-black/70 px-4 py-4 text-brand-white">
            <p className="font-semibold text-base">Nao foi possivel confirmar.</p>
            <p className="mt-2">{result?.message ?? "Token invalido ou expirado."}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/60 px-4 py-4">
            <p className="font-semibold text-white text-base">
              {sent === "0"
                ? "Conta criada, mas o e-mail ainda nao saiu."
                : "Conta criada com sucesso."}
            </p>
            <p className="mt-2">
              {sent === "0"
                ? "Use o reenvio de confirmacao para gerar um novo link."
                : "Enviamos um link de confirmacao para o seu e-mail."}
            </p>
            {targetEmail ? (
              <p className="mt-2 text-white">
                Endereco informado: <strong>{targetEmail}</strong>
              </p>
            ) : null}
          </div>
        )}

        <div className="space-y-3">
          {result?.ok ? (
            <Link
              href={loginHref}
              className="block w-full rounded-xl bg-brand-red px-4 py-3 text-center font-semibold text-black transition hover:bg-brand-red-dark"
            >
              Ir para o login
            </Link>
          ) : (
            <Link
              href={resendHref}
              className="block w-full rounded-xl bg-brand-red px-4 py-3 text-center font-semibold text-black transition hover:bg-brand-red-dark"
            >
              Reenviar confirmacao
            </Link>
          )}

          <Link
            href="/login"
            className="block text-center text-brand-red hover:underline"
          >
            Voltar para login
          </Link>
        </div>
      </div>
    </AuthCard>
  );
}
