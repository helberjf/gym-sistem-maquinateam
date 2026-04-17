import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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

  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );

  return (
    <section className="w-full max-w-sm px-2">
      <Link
        href="/"
        className="mb-1 inline-flex items-center gap-2 text-[13px] font-medium text-neutral-300 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para home
      </Link>

      <div className="rounded-lg border border-white/10 bg-white px-4 py-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="mb-1 text-center text-lg font-bold text-neutral-900 dark:text-white">
          Criar conta
        </h1>

        <p className="mb-3 text-center text-[12.5px] text-neutral-500 dark:text-neutral-400">
          Preencha os campos para se registrar.
        </p>

        <RegisterForm googleEnabled={googleEnabled} />
      </div>
    </section>
  );
}
