import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login",
  description: "Acesse sua conta para acompanhar planos, pagamentos e treinos.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LoginPage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );

  return (
    <section className="mx-auto flex w-full max-w-md flex-col">
      <div className="mb-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-gray-light">
          Area do aluno
        </p>
        <h1 className="mt-3 text-3xl font-bold uppercase leading-tight text-white sm:text-4xl">
          Entrar
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-brand-gray-light">
          Acesse pagamentos, treinos e comunicados da academia.
        </p>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-brand-gray-dark/80 p-5 shadow-[0_18px_54px_rgba(0,0,0,0.3)] backdrop-blur sm:p-6">
        <LoginForm googleEnabled={googleEnabled} />
      </div>

      <div className="mt-5 flex justify-center">
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gray-light transition hover:text-white"
        >
          Voltar para home
        </Link>
      </div>
    </section>
  );
}
