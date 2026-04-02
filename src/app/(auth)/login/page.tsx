import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { Button } from "@/components/ui/Button";

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
    <div className="flex w-full max-w-md flex-col gap-4">
      <Button asChild variant="ghost" className="w-full">
        <Link href="/">Voltar para a home</Link>
      </Button>

      <AuthCard
        title="Entrar na conta"
        description="Use seu e-mail e senha ou continue com Google."
      >
        <LoginForm googleEnabled={googleEnabled} />
      </AuthCard>
    </div>
  );
}
