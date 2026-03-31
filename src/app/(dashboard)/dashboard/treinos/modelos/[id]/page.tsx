import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { ApiActionButton } from "@/components/dashboard/ApiActionButton";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { TrainingTemplateForm } from "@/components/dashboard/TrainingTemplateForm";
import { formatDate } from "@/lib/academy/constants";
import { getViewerContextFromSession } from "@/lib/academy/access";
import { requirePermission } from "@/lib/auth/guards";
import { getTrainingTemplateDetailData } from "@/lib/training/service";

export const metadata: Metadata = {
  title: "Detalhes do modelo",
  description: "Edicao, duplicacao e historico do modelo de treino.",
};

type RouteParams = Promise<{ id: string }>;

export default async function TrainingTemplateDetailPage({
  params,
}: {
  params: RouteParams;
}) {
  const session = await requirePermission(
    "manageTrainings",
    "/dashboard/treinos",
  );
  const viewer = await getViewerContextFromSession(session);
  const { id } = await params;
  const data = await getTrainingTemplateDetailData(viewer, id);
  const { template, structure } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Modelo de treino"
        title={template.name}
        description={`Modalidade ${template.modality?.name ?? "nao definida"} • atualizado em ${formatDate(template.updatedAt)}`}
        action={
          <Button asChild variant="secondary">
            <Link href="/dashboard/treinos">Voltar para treinos</Link>
          </Button>
        }
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-5 xl:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={template.isActive ? "success" : "neutral"}>
              {template.isActive ? "Ativo" : "Inativo"}
            </StatusBadge>
            {template.modality ? (
              <StatusBadge tone="info">{template.modality.name}</StatusBadge>
            ) : null}
            {template.level ? <StatusBadge tone="neutral">{template.level}</StatusBadge> : null}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                Professor
              </p>
              <p className="mt-3 text-sm font-semibold text-white">
                {template.teacherProfile?.user.name ?? "Biblioteca compartilhada"}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                Duracao estimada
              </p>
              <p className="mt-3 text-sm font-semibold text-white">
                {template.durationMinutes ? `${template.durationMinutes} min` : "Nao definida"}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                Atribuicoes recentes
              </p>
              <p className="mt-3 text-sm font-semibold text-white">
                {template.assignments.length} registro(s)
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                Objetivo
              </p>
              <p className="mt-3 text-sm text-white">
                {template.objective ?? "Sem objetivo definido."}
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
                  Desaquecimento
                </p>
                <ul className="mt-3 space-y-2 text-sm text-white">
                  {structure.desaquecimento.length > 0 ? (
                    structure.desaquecimento.map((item) => <li key={item}>• {item}</li>)
                  ) : (
                    <li>Sem itens cadastrados.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-5">
          <h2 className="text-lg font-bold text-white">Acoes rapidas</h2>
          <div className="mt-4 space-y-3">
            <ApiActionButton
              endpoint={`/api/training-templates/${template.id}/duplicate`}
              method="POST"
              label="Duplicar modelo"
              loadingLabel="Duplicando..."
              variant="secondary"
            />
            {template.isActive ? (
              <ApiActionButton
                endpoint={`/api/training-templates/${template.id}`}
                method="DELETE"
                label="Arquivar modelo"
                loadingLabel="Arquivando..."
                variant="danger"
                confirmMessage="Deseja realmente arquivar este modelo?"
              />
            ) : null}
            <p className="text-sm text-brand-gray-light">
              Os modelos arquivados continuam no historico, mas deixam de aparecer como base para novas atribuicoes.
            </p>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
        <h2 className="text-xl font-bold text-white">Editar modelo</h2>
        <p className="mt-1 text-sm text-brand-gray-light">
          Ajuste a estrutura do treino, o nivel e a modalidade vinculada.
        </p>
        <div className="mt-6">
          <TrainingTemplateForm
            mode="edit"
            endpoint={`/api/training-templates/${template.id}`}
            initialValues={{
              id: template.id,
              name: template.name,
              slug: template.slug,
              modalityId: template.modality?.id ?? "",
              teacherProfileId: template.teacherProfileId ?? "",
              level: template.level ?? "",
              description: template.description ?? "",
              objective: template.objective ?? "",
              durationMinutes: template.durationMinutes ? String(template.durationMinutes) : "",
              aquecimento: structure.aquecimento.join("\n"),
              blocoTecnico: structure.blocoTecnico.join("\n"),
              blocoFisico: structure.blocoFisico.join("\n"),
              desaquecimento: structure.desaquecimento.join("\n"),
              rounds: structure.rounds ?? "",
              series: structure.series ?? "",
              repeticoes: structure.repeticoes ?? "",
              tempo: structure.tempo ?? "",
              observacoes: structure.observacoes ?? "",
              isActive: template.isActive,
            }}
            options={{
              modalities: data.options.modalities,
              teachers: data.options.teachers,
            }}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Ultimas atribuicoes</h2>
            <p className="mt-1 text-sm text-brand-gray-light">
              Alunos que receberam este modelo recentemente.
            </p>
          </div>
          <StatusBadge tone="neutral">{template.assignments.length} item(ns)</StatusBadge>
        </div>

        {template.assignments.length === 0 ? (
          <p className="mt-6 text-sm text-brand-gray-light">
            Nenhuma atribuicao recente foi registrada para este modelo.
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {template.assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {assignment.studentProfile.user.name}
                    </p>
                    <p className="mt-1 text-xs text-brand-gray-light">
                      {assignment.studentProfile.registrationNumber} • {formatDate(assignment.assignedAt)}
                    </p>
                  </div>
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/dashboard/treinos/atribuicoes/${assignment.id}`}>
                      Abrir atribuicao
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
