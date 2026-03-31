import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { ApiActionButton } from "@/components/dashboard/ApiActionButton";
import { ClassScheduleForm } from "@/components/dashboard/ClassScheduleForm";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { getViewerContextFromSession } from "@/lib/academy/access";
import {
  formatDate,
  formatDateTime,
  getAttendanceStatusLabel,
  getWeekdayLabels,
  toDateInputValue,
} from "@/lib/academy/constants";
import { getAttendanceStatusTone } from "@/lib/academy/presentation";
import { getClassScheduleDetailData } from "@/lib/academy/service";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Detalhes da turma",
  description: "Horario, vinculos e presenca recente da turma.",
};

type RouteParams = Promise<{ id: string }>;

export default async function ClassScheduleDetailPage({
  params,
}: {
  params: RouteParams;
}) {
  const session = await requirePermission("viewClassSchedules", "/dashboard/turmas");
  const viewer = await getViewerContextFromSession(session);
  const { id } = await params;
  const data = await getClassScheduleDetailData(viewer, id);
  const { classSchedule } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Turma"
        title={classSchedule.title}
        description={`${classSchedule.modality.name} com ${classSchedule.teacherProfile.user.name} na grade operacional.`}
        action={
          <Button asChild variant="secondary">
            <Link href="/dashboard/turmas">Voltar para turmas</Link>
          </Button>
        }
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-5 xl:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={classSchedule.isActive ? "success" : "danger"}>
              {classSchedule.isActive ? "Ativa" : "Arquivada"}
            </StatusBadge>
            <StatusBadge tone="info">
              {getWeekdayLabels(
                classSchedule.daysOfWeek.length > 0
                  ? classSchedule.daysOfWeek
                  : [classSchedule.dayOfWeek],
              ).join(", ")}
            </StatusBadge>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                Horario
              </p>
              <p className="mt-3 text-sm text-white">
                {classSchedule.startTime} - {classSchedule.endTime}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                Sala
              </p>
              <p className="mt-3 text-sm text-white">
                {classSchedule.room ?? "Nao definida"}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                Capacidade
              </p>
              <p className="mt-3 text-sm text-white">
                {classSchedule.capacity ?? "Sem limite"}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-5">
          <h2 className="text-lg font-bold text-white">Acoes rapidas</h2>
          <div className="mt-4 space-y-3">
            {data.canManage ? (
              <ApiActionButton
                endpoint={`/api/class-schedules/${classSchedule.id}`}
                method="DELETE"
                label="Arquivar turma"
                loadingLabel="Arquivando..."
                variant="danger"
                confirmMessage="Deseja realmente arquivar esta turma?"
              />
            ) : null}
          </div>
        </article>
      </section>

      {data.canManage && data.options ? (
        <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
          <h2 className="text-xl font-bold text-white">Editar turma</h2>
          <div className="mt-6">
            <ClassScheduleForm
              mode="edit"
              endpoint={`/api/class-schedules/${classSchedule.id}`}
              initialValues={{
                id: classSchedule.id,
                title: classSchedule.title,
                description: classSchedule.description ?? "",
                modalityId: classSchedule.modalityId,
                teacherProfileId: classSchedule.teacherProfileId,
                daysOfWeek: (
                  classSchedule.daysOfWeek.length > 0
                    ? classSchedule.daysOfWeek
                    : [classSchedule.dayOfWeek]
                ).map(String),
                startTime: classSchedule.startTime,
                endTime: classSchedule.endTime,
                room: classSchedule.room ?? "",
                capacity: classSchedule.capacity?.toString() ?? "",
                validFrom: toDateInputValue(classSchedule.validFrom),
                validUntil: toDateInputValue(classSchedule.validUntil),
                isActive: classSchedule.isActive,
                studentIds: classSchedule.enrollments
                  .filter((enrollment) => enrollment.isActive)
                  .map((enrollment) => enrollment.studentProfile.id),
              }}
              options={{
                modalities: data.options.modalities.map((modality) => ({
                  id: modality.id,
                  name: modality.name,
                })),
                teachers: data.options.teachers.map((teacher) => ({
                  id: teacher.id,
                  name: teacher.user.name,
                })),
                students: data.options.students.map((student) => ({
                  id: student.id,
                  registrationNumber: student.registrationNumber,
                  name: student.user.name,
                })),
              }}
            />
          </div>
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
          <h2 className="text-xl font-bold text-white">Alunos vinculados</h2>
          {classSchedule.enrollments.length === 0 ? (
            <p className="mt-4 text-sm text-brand-gray-light">
              Nenhum aluno matriculado nesta turma.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {classSchedule.enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {enrollment.studentProfile.user.name}
                      </p>
                      <p className="mt-1 text-xs text-brand-gray-light">
                        {enrollment.studentProfile.registrationNumber}
                      </p>
                    </div>
                    <StatusBadge tone={enrollment.isActive ? "success" : "neutral"}>
                      {enrollment.isActive ? "Ativo" : "Encerrado"}
                    </StatusBadge>
                  </div>
                  <p className="mt-3 text-xs text-brand-gray-light">
                    Inicio {formatDate(enrollment.startsAt)} • Fim {formatDate(enrollment.endsAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
          <h2 className="text-xl font-bold text-white">Presenca recente</h2>
          {classSchedule.attendances.length === 0 ? (
            <p className="mt-4 text-sm text-brand-gray-light">
              Ainda nao existem registros de presenca nesta turma.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {classSchedule.attendances.map((attendance) => (
                <div
                  key={attendance.id}
                  className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {attendance.studentProfile.user.name}
                      </p>
                      <p className="mt-1 text-xs text-brand-gray-light">
                        {formatDate(attendance.classDate)}
                      </p>
                    </div>
                    <StatusBadge tone={getAttendanceStatusTone(attendance.status)}>
                      {getAttendanceStatusLabel(attendance.status)}
                    </StatusBadge>
                  </div>
                  <p className="mt-3 text-xs text-brand-gray-light">
                    Check-in {formatDateTime(attendance.checkedInAt)} • Check-out {formatDateTime(attendance.checkedOutAt)}
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
