import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Esqueci a senha",
  description: "Solicite um link seguro para redefinir sua senha.",
  robots: {
    index: false,
    follow: false,
  },
};

function getSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EsqueciSenhaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const email = getSingleValue(params.email);

  return (
    <AuthCard
      title="Esqueci minha senha"
      description="Enviamos um link temporario por e-mail quando a conta estiver apta ao reset."
    >
      <ForgotPasswordForm initialEmail={email} />
    </AuthCard>
  );
}
