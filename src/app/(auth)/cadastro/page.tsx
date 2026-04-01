import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthCard } from "@/components/auth/AuthCard";
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
    <AuthCard
      title="Criar conta"
      description="Seu cadastro fica pendente ate a confirmacao do e-mail."
    >
      <RegisterForm googleEnabled={googleEnabled} />
    </AuthCard>
  );
}
