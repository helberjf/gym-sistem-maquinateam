import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TrainingTemplateForm } from "@/components/dashboard/TrainingTemplateForm";
import { getViewerContextFromSession } from "@/lib/academy/access";
import { requirePermission } from "@/lib/auth/guards";
import { getTrainingOptions } from "@/lib/training/service";

export const metadata: Metadata = {
  title: "Novo modelo de treino",
  description: "Crie um template reutilizavel para professores e alunos.",
};

export default async function NewTrainingTemplatePage() {
  const session = await requirePermission(
    "manageTrainings",
    "/dashboard/treinos/modelos/novo",
  );
  const viewer = await getViewerContextFromSession(session);
  const options = await getTrainingOptions(viewer);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Treinos"
        title="Novo modelo"
        description="Estruture aquecimento, bloco tecnico, bloco fisico e observacoes para reaproveitar o treino com consistencia."
        action={
          <Button asChild variant="secondary">
            <Link href="/dashboard/treinos">Voltar para treinos</Link>
          </Button>
        }
      />

      <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
        <TrainingTemplateForm
          mode="create"
          endpoint="/api/training-templates"
          initialValues={{
            name: "",
            slug: "",
            modalityId: options.modalities[0]?.id ?? "",
            teacherProfileId: viewer.teacherProfileId ?? options.teachers[0]?.id ?? "",
            level: "",
            description: "",
            objective: "",
            durationMinutes: "",
            aquecimento: "",
            blocoTecnico: "",
            blocoFisico: "",
            desaquecimento: "",
            rounds: "",
            series: "",
            repeticoes: "",
            tempo: "",
            observacoes: "",
            isActive: true,
          }}
          options={{
            modalities: options.modalities,
            teachers: options.teachers,
          }}
        />
      </section>
    </div>
  );
}
