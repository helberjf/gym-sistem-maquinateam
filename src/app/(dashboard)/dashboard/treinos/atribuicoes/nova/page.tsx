import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TrainingAssignmentForm } from "@/components/dashboard/TrainingAssignmentForm";
import { getViewerContextFromSession } from "@/lib/academy/access";
import { toDateInputValue } from "@/lib/academy/constants";
import { requirePermission } from "@/lib/auth/guards";
import { getTrainingOptions } from "@/lib/training/service";

export const metadata: Metadata = {
  title: "Nova atribuicao de treino",
  description: "Atribua um modelo a um ou mais alunos.",
};

export default async function NewTrainingAssignmentPage() {
  const session = await requirePermission(
    "manageTrainings",
    "/dashboard/treinos/atribuicoes/nova",
  );
  const viewer = await getViewerContextFromSession(session);
  const options = await getTrainingOptions(viewer);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Treinos"
        title="Nova atribuicao"
        description="Escolha um modelo, selecione os alunos e personalize objetivo, validade e orientacoes do professor."
        action={
          <Button asChild variant="secondary">
            <Link href="/dashboard/treinos">Voltar para treinos</Link>
          </Button>
        }
      />

      <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
        <TrainingAssignmentForm
          mode="create"
          endpoint="/api/training-assignments"
          initialValues={{
            trainingTemplateId: options.templates[0]?.id ?? "",
            studentIds: [],
            teacherProfileId: viewer.teacherProfileId ?? options.teachers[0]?.id ?? "",
            title: "",
            instructions: "",
            objective: "",
            observacoesProfessor: "",
            assignedAt: toDateInputValue(new Date()),
            dueAt: "",
            status: "ASSIGNED",
            studentNotes: "",
            feedback: "",
          }}
          options={{
            templates: options.templates,
            students: options.students,
            teachers: options.teachers,
          }}
          canManage
        />
      </section>
    </div>
  );
}
