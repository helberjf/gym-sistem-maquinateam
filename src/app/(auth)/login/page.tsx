import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
    <section className="mx-auto mt-2 w-full max-w-sm px-2 sm:mt-4">
      <Link
        href="/"
        className="mb-1 inline-flex items-center gap-2 text-[13px] font-medium text-neutral-300 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para home
      </Link>

      <div className="rounded-lg border bg-white px-4 py-4 shadow-sm dark:bg-neutral-900">
        <h1 className="mb-1 text-center text-lg font-bold text-neutral-900 dark:text-white">
          Acesse sua conta
        </h1>

        <p className="mb-3 text-center text-[12.5px] text-neutral-500 dark:text-neutral-400">
          Entre com seu e-mail e senha para continuar.
        </p>

        <LoginForm googleEnabled={googleEnabled} />
      </div>
    </section>
  );
}
