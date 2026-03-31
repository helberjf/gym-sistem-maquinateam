import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { TrainingAssignmentForm } from "@/components/dashboard/TrainingAssignmentForm";
import { formatDate, toDateInputValue } from "@/lib/academy/constants";
import { getViewerContextFromSession } from "@/lib/academy/access";
import { requirePermission } from "@/lib/auth/guards";
import {
  extractTrainingMetadata,
  getTrainingAssignmentStatusLabel,
} from "@/lib/training/constants";
import { getTrainingAssignmentTone } from "@/lib/training/presentation";
import { getTrainingAssignmentDetailData } from "@/lib/training/service";

export const metadata: Metadata = {
  title: "Detalhes do treino atribuido",
  description: "Acompanhe o treino, orientacoes do professor e progresso do aluno.",
};

type RouteParams = Promise<{ id: string }>;

export default async function TrainingAssignmentDetailPage({
  params,
}: {
  params: RouteParams;
}) {
  const session = await requirePermission("viewTrainings", "/dashboard/treinos");
  const viewer = await getViewerContextFromSession(session);
  const { id } = await params;
  const data = await getTrainingAssignmentDetailData(viewer, id);
  const { assignment, structure, canManage, isStudentOwner } = data;
  const metadata = extractTrainingMetadata(
    assignment.content ?? assignment.trainingTemplate?.content ?? null,
  );
  const canEdit =
    (canManage && !isStudentOwner) || (viewer.role === "ALUNO" && isStudentOwner);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Treino atribuido"
        title={assignment.title}
        description={`Aluno ${assignment.studentProfile.user.name} • atribuido em ${formatDate(assignment.assignedAt)}`}
        action={
          <Button asChild variant="secondary">
            <Link href="/dashboard/treinos">Voltar para treinos</Link>
          </Button>
        }
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-5 xl:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={getTrainingAssignmentTone(assignment.status)}>
              {getTrainingAssignmentStatusLabel(assignment.status)}
            </StatusBadge>
            {assignment.trainingTemplate?.modality ? (
              <StatusBadge tone="info">{assignment.trainingTemplate.modality.name}</StatusBadge>
            ) : null}
            {assignment.trainingTemplate?.level ? (
              <StatusBadge tone="neutral">{assignment.trainingTemplate.level}</StatusBadge>
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                Aluno
              </p>
              <p className="mt-3 text-sm font-semibold text-white">
                {assignment.studentProfile.user.name}
              </p>
              <p className="mt-1 text-xs text-brand-gray-light">
                {assignment.studentProfile.registrationNumber}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                Professor
              </p>
              <p className="mt-3 text-sm font-semibold text-white">
                {assignment.teacherProfile?.user.name ?? "Equipe"}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                Validade
              </p>
              <p className="mt-3 text-sm font-semibold text-white">
                {formatDate(assignment.dueAt)}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                Objetivo
              </p>
              <p className="mt-3 text-sm text-white">
                {metadata.objective ??
                  assignment.trainingTemplate?.objective ??
                  "Sem objetivo especificado."}
              </p>
            </div>

            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                Instrucoes
              </p>
              <p className="mt-3 whitespace-pre-line text-sm text-white">
                {assignment.instructions ?? "Sem instrucoes adicionais cadastradas."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                  Aquecimento
                </p>
                <ul className="mt-3 space-y-2 text-sm text-white">
                  {structure.aquecimento.length > 0 ? (
                    structure.aquecimento.map((item) => <li key={item}>• {item}</li>)
                  ) : (
                    <li>Sem itens cadastrados.</li>
                  )}
                </ul>
              </div>
              <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                  Bloco tecnico
                </p>
                <ul className="mt-3 space-y-2 text-sm text-white">
                  {structure.blocoTecnico.length > 0 ? (
                    structure.blocoTecnico.map((item) => <li key={item}>• {item}</li>)
                  ) : (
                    <li>Sem itens cadastrados.</li>
                  )}
                </ul>
              </div>
              <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                  Bloco fisico
                </p>
                <ul className="mt-3 space-y-2 text-sm text-white">
                  {structure.blocoFisico.length > 0 ? (
                    structure.blocoFisico.map((item) => <li key={item}>• {item}</li>)
                  ) : (
                    <li>Sem itens cadastrados.</li>
                  )}
                </ul>
              </div>
              <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                  Observacoes do professor
                </p>
                <p className="mt-3 whitespace-pre-line text-sm text-white">
                  {metadata.observacoesProfessor ?? "Sem observacoes complementares."}
                </p>
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-5">
          <h2 className="text-lg font-bold text-white">Resumo rapido</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                Modelo base
              </p>
              <p className="mt-3 text-sm font-semibold text-white">
                {assignment.trainingTemplate?.name ?? "Treino livre"}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                Inicio
              </p>
              <p className="mt-3 text-sm font-semibold text-white">
                {formatDate(assignment.startAt)}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                Conclusao
              </p>
              <p className="mt-3 text-sm font-semibold text-white">
                {formatDate(assignment.completedAt)}
              </p>
            </div>
          </div>
        </article>
      </section>

      {canEdit ? (
        <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
          <h2 className="text-xl font-bold text-white">
            {isStudentOwner ? "Atualizar meu progresso" : "Editar atribuicao"}
          </h2>
          <p className="mt-1 text-sm text-brand-gray-light">
            {isStudentOwner
              ? "Marque a leitura, finalize o treino e deixe anotacoes para acompanhamento."
              : "Ajuste status, validade, instrucoes e feedback conforme a evolucao do aluno."}
          </p>
          <div className="mt-6">
            <TrainingAssignmentForm
              mode="edit"
              endpoint={`/api/training-assignments/${assignment.id}`}
              initialValues={{
                id: assignment.id,
                trainingTemplateId: assignment.trainingTemplate?.id ?? "",
                studentIds: [assignment.studentProfile.id],
                teacherProfileId: assignment.teacherProfile?.id ?? "",
                title: assignment.title,
                instructions: assignment.instructions ?? "",
                objective: metadata.objective ?? "",
                observacoesProfessor: metadata.observacoesProfessor ?? "",
                assignedAt: toDateInputValue(assignment.assignedAt),
                dueAt: toDateInputValue(assignment.dueAt),
                status: assignment.status,
                studentNotes: assignment.studentNotes ?? "",
                feedback: assignment.feedback ?? "",
              }}
              canManage={canManage}
              isStudentOwner={isStudentOwner}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
