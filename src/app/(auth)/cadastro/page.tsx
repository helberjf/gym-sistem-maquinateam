import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Cadastro",
  description: "Crie sua conta, confirme seu e-mail e acesse a area privada.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CadastroPage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col">
      <div className="mb-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-gray-light">
          Novo acesso
        </p>
        <h1 className="mt-3 text-3xl font-bold uppercase leading-tight text-white sm:text-4xl">
          Criar conta
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-brand-gray-light">
          Informe seus dados principais para acessar planos, pagamentos e
          comunicados da academia.
        </p>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-brand-gray-dark/80 p-5 shadow-[0_18px_54px_rgba(0,0,0,0.3)] backdrop-blur sm:p-6">
        <RegisterForm />
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
