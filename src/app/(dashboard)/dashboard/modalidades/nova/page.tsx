import type { Metadata } from "next";
import { ModalityForm } from "@/components/dashboard/ModalityForm";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Nova modalidade",
  description: "Cadastro operacional de modalidades.",
};

export default async function NewModalityPage() {
  await requirePermission("manageModalities", "/dashboard/modalidades/nova");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cadastro"
        title="Nova modalidade"
        description="Crie uma modalidade reutilizavel para alunos, professores, turmas e planos."
      />

      <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
        <ModalityForm
          mode="create"
          endpoint="/api/modalities"
          initialValues={{
            name: "",
            slug: "",
            description: "",
            colorHex: "#C8102E",
            sortOrder: "0",
            isActive: true,
          }}
        />
      </section>
    </div>
  );
}
