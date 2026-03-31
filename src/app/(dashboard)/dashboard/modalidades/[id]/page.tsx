import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { ApiActionButton } from "@/components/dashboard/ApiActionButton";
import { ModalityForm } from "@/components/dashboard/ModalityForm";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { getViewerContextFromSession } from "@/lib/academy/access";
import { getWeekdayLabels } from "@/lib/academy/constants";
import { getModalityDetailData } from "@/lib/academy/service";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Detalhes da modalidade",
  description: "Turmas, professores e configuracoes da modalidade.",
};

type RouteParams = Promise<{ id: string }>;

export default async function ModalityDetailPage({
  params,
}: {
  params: RouteParams;
}) {
  const session = await requirePermission("viewModalities", "/dashboard/modalidades");
  const viewer = await getViewerContextFromSession(session);
  const { id } = await params;
  const data = await getModalityDetailData(viewer, id);
  const { modality } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Modalidade"
        title={modality.name}
        description={modality.description ?? "Sem descricao registrada para esta modalidade."}
        action={
          <Button asChild variant="secondary">
            <Link href="/dashboard/modalidades">Voltar para modalidades</Link>
          </Button>
        }
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-5 xl:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={modality.isActive ? "success" : "danger"}>
              {modality.isActive ? "Ativa" : "Arquivada"}
            </StatusBadge>
            <StatusBadge tone="info">Slug {modality.slug}</StatusBadge>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                Professores
              </p>
              <p className="mt-3 text-2xl font-black text-white">
                {modality.teachers.length}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                Turmas
              </p>
              <p className="mt-3 text-2xl font-black text-white">
                {modality.classSchedules.length}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                Alunos principais
              </p>
              <p className="mt-3 text-2xl font-black text-white">
                {modality.primaryStudents.length}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-5">
          <h2 className="text-lg font-bold text-white">Acoes rapidas</h2>
          <div className="mt-4 space-y-3">
            {data.canManage ? (
              <ApiActionButton
                endpoint={`/api/modalities/${modality.id}`}
                method="DELETE"
                label="Arquivar modalidade"
                loadingLabel="Arquivando..."
                variant="danger"
                confirmMessage="Deseja realmente arquivar esta modalidade?"
              />
            ) : null}
          </div>
        </article>
      </section>

      {data.canManage ? (
        <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
          <h2 className="text-xl font-bold text-white">Editar modalidade</h2>
          <div className="mt-6">
            <ModalityForm
              mode="edit"
              endpoint={`/api/modalities/${modality.id}`}
              initialValues={{
                id: modality.id,
                name: modality.name,
                slug: modality.slug,
                description: modality.description ?? "",
                colorHex: modality.colorHex ?? "",
                sortOrder: modality.sortOrder.toString(),
                isActive: modality.isActive,
              }}
            />
          </div>
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
          <h2 className="text-xl font-bold text-white">Professores</h2>
          {modality.teachers.length === 0 ? (
            <p className="mt-4 text-sm text-brand-gray-light">
              Nenhum professor vinculado a esta modalidade.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {modality.teachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4"
                >
                  <p className="text-sm font-semibold text-white">
                    {teacher.user.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
          <h2 className="text-xl font-bold text-white">Turmas</h2>
          {modality.classSchedules.length === 0 ? (
            <p className="mt-4 text-sm text-brand-gray-light">
              Nenhuma turma registrada para esta modalidade.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {modality.classSchedules.map((classSchedule) => (
                <div
                  key={classSchedule.id}
                  className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4"
                >
                  <p className="text-sm font-semibold text-white">
                    {classSchedule.title}
                  </p>
                  <p className="mt-1 text-xs text-brand-gray-light">
                    {getWeekdayLabels(
                      classSchedule.daysOfWeek.length > 0
                        ? classSchedule.daysOfWeek
                        : [classSchedule.dayOfWeek],
                    ).join(", ")} • {classSchedule.startTime} - {classSchedule.endTime}
                  </p>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
