import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Reenviar confirmacao",
  description: "Solicite um novo link de confirmacao de e-mail.",
  robots: {
    index: false,
    follow: false,
  },
};

function getSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ReenvioConfirmacaoPage({
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
      title="Reenviar confirmacao"
      description="Geramos um novo link seguro e expiravel para validar seu e-mail."
    >
      <ResendVerificationForm initialEmail={email} />
    </AuthCard>
  );
}
