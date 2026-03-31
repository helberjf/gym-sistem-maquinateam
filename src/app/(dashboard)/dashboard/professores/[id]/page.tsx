import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { ApiActionButton } from "@/components/dashboard/ApiActionButton";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { TeacherForm } from "@/components/dashboard/TeacherForm";
import { getViewerContextFromSession } from "@/lib/academy/access";
import { formatDate, getWeekdayLabels, toDateInputValue } from "@/lib/academy/constants";
import { getTeacherDetailData } from "@/lib/academy/service";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Detalhes do professor",
  description: "Perfil, modalidades e turmas do professor.",
};

type RouteParams = Promise<{ id: string }>;

export default async function TeacherDetailPage({
  params,
}: {
  params: RouteParams;
}) {
  const session = await requirePermission("viewTeachers", "/dashboard/professores");
  const viewer = await getViewerContextFromSession(session);
  const { id } = await params;
  const data = await getTeacherDetailData(viewer, id);
  const { teacher } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Professor"
        title={teacher.user.name}
        description={`Registro ${teacher.registrationNumber ?? "nao definido"} com turmas e modalidades relacionadas.`}
        action={
          <Button asChild variant="secondary">
            <Link href="/dashboard/professores">Voltar para professores</Link>
          </Button>
        }
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-5 xl:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={teacher.isActive ? "success" : "danger"}>
              {teacher.isActive ? "Perfil ativo" : "Perfil inativo"}
            </StatusBadge>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                Contato
              </p>
              <p className="mt-3 text-sm text-white">{teacher.user.email}</p>
              <p className="mt-1 text-sm text-brand-gray-light">
                {teacher.user.phone ?? "Sem telefone cadastrado"}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                Perfil tecnico
              </p>
              <p className="mt-3 text-sm text-white">
                Experiencia: {teacher.experienceYears ?? 0} ano(s)
              </p>
              <p className="mt-1 text-sm text-white">
                Admissao: {formatDate(teacher.hireDate)}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-5">
          <h2 className="text-lg font-bold text-white">Acoes rapidas</h2>
          <div className="mt-4 space-y-3">
            {data.canManage ? (
              <ApiActionButton
                endpoint={`/api/teachers/${teacher.id}`}
                method="DELETE"
                label="Inativar professor"
                loadingLabel="Inativando..."
                variant="danger"
                confirmMessage="Deseja realmente inativar este professor?"
              />
            ) : null}
            <div className="flex flex-wrap gap-2">
              {teacher.modalities.map((modality) => (
                <StatusBadge key={modality.id} tone="info">
                  {modality.name}
                </StatusBadge>
              ))}
            </div>
          </div>
        </article>
      </section>

      {data.canManage && data.options ? (
        <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
          <h2 className="text-xl font-bold text-white">Editar dados</h2>
          <div className="mt-6">
            <TeacherForm
              mode="edit"
              endpoint={`/api/teachers/${teacher.id}`}
              initialValues={{
                id: teacher.id,
                name: teacher.user.name,
                email: teacher.user.email,
                phone: teacher.user.phone ?? "",
                registrationNumber: teacher.registrationNumber ?? "",
                cpf: teacher.cpf ?? "",
                specialties: teacher.specialties ?? "",
                experienceYears: teacher.experienceYears?.toString() ?? "",
                hireDate: toDateInputValue(teacher.hireDate),
                beltLevel: teacher.beltLevel ?? "",
                notes: teacher.notes ?? teacher.bio ?? "",
                modalityIds: teacher.modalities.map((modality) => modality.id),
                isActive: teacher.isActive,
              }}
              options={{
                modalities: data.options.modalities.map((modality) => ({
                  id: modality.id,
                  name: modality.name,
                })),
              }}
            />
          </div>
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
          <h2 className="text-xl font-bold text-white">Turmas</h2>
          {teacher.classes.length === 0 ? (
            <p className="mt-4 text-sm text-brand-gray-light">
              Nenhuma turma vinculada a este professor.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {teacher.classes.map((classSchedule) => (
                <div
                  key={classSchedule.id}
                  className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {classSchedule.title}
                      </p>
                      <p className="mt-1 text-xs text-brand-gray-light">
                        {classSchedule.modality.name} • {getWeekdayLabels(
                          classSchedule.daysOfWeek.length > 0
                            ? classSchedule.daysOfWeek
                            : [classSchedule.dayOfWeek],
                        ).join(", ")} • {classSchedule.startTime} - {classSchedule.endTime}
                      </p>
                    </div>
                    <StatusBadge tone={classSchedule.isActive ? "success" : "neutral"}>
                      {classSchedule._count.enrollments} aluno(s)
                    </StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
          <h2 className="text-xl font-bold text-white">Alunos sob responsabilidade</h2>
          {teacher.responsibleStudents.length === 0 ? (
            <p className="mt-4 text-sm text-brand-gray-light">
              Nenhum aluno esta marcado com este professor como responsavel.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {teacher.responsibleStudents.map((student) => (
                <div
                  key={student.id}
                  className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4"
                >
                  <p className="text-sm font-semibold text-white">
                    {student.user.name}
                  </p>
                  <p className="mt-1 text-xs text-brand-gray-light">
                    {student.registrationNumber}
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
