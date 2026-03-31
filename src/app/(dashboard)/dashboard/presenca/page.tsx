import type { Metadata } from "next";
import { ApiActionButton } from "@/components/dashboard/ApiActionButton";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { getViewerContextFromSession } from "@/lib/academy/access";
import {
  formatDate,
  formatDateTime,
  getAttendanceStatusLabel,
  getWeekdayLabels,
} from "@/lib/academy/constants";
import {
  flattenSearchParams,
  getAttendanceStatusTone,
} from "@/lib/academy/presentation";
import { getAttendancePageData } from "@/lib/academy/service";
import { requirePermission } from "@/lib/auth/guards";
import { attendanceFiltersSchema, parseSearchParams } from "@/lib/validators";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Presenca",
  description: "Check-in, check-out e historico de presencas.",
};

function getTopEntries(source: Record<string, number>) {
  return Object.entries(source)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3);
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requirePermission("viewAttendance", "/dashboard/presenca");
  const viewer = await getViewerContextFromSession(session);
  const filters = parseSearchParams(
    flattenSearchParams(await searchParams),
    attendanceFiltersSchema,
  );
  const data = await getAttendancePageData(viewer, filters);
  const todayString = data.today.toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Presenca"
        title="Check-in, check-out e historico"
        description="Monitore a operacao do dia e navegue pelos registros por aluno, turma, modalidade e professor."
      />

      <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-5">
        <form className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <select
            name="studentId"
            defaultValue={filters.studentId ?? ""}
            className="rounded-xl border border-brand-gray-mid bg-brand-black px-4 py-3 text-sm text-white outline-none transition focus:border-brand-red"
          >
            <option value="">Todos os alunos</option>
            {data.options.students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.user.name}
              </option>
            ))}
          </select>
          <select
            name="classScheduleId"
            defaultValue={filters.classScheduleId ?? ""}
            className="rounded-xl border border-brand-gray-mid bg-brand-black px-4 py-3 text-sm text-white outline-none transition focus:border-brand-red"
          >
            <option value="">Todas as turmas</option>
            {data.options.classSchedules.map((classSchedule) => (
              <option key={classSchedule.id} value={classSchedule.id}>
                {classSchedule.title}
              </option>
            ))}
          </select>
          <select
            name="modalityId"
            defaultValue={filters.modalityId ?? ""}
            className="rounded-xl border border-brand-gray-mid bg-brand-black px-4 py-3 text-sm text-white outline-none transition focus:border-brand-red"
          >
            <option value="">Todas as modalidades</option>
            {data.options.modalities.map((modality) => (
              <option key={modality.id} value={modality.id}>
                {modality.name}
              </option>
            ))}
          </select>
          <select
            name="teacherId"
            defaultValue={filters.teacherId ?? ""}
            className="rounded-xl border border-brand-gray-mid bg-brand-black px-4 py-3 text-sm text-white outline-none transition focus:border-brand-red"
          >
            <option value="">Todos os professores</option>
            {data.options.teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.user.name}
              </option>
            ))}
          </select>
          <input
            name="dateFrom"
            type="date"
            defaultValue={filters.dateFrom ?? ""}
            className="rounded-xl border border-brand-gray-mid bg-brand-black px-4 py-3 text-sm text-white outline-none transition focus:border-brand-red"
          />
          <input
            name="dateTo"
            type="date"
            defaultValue={filters.dateTo ?? ""}
            className="rounded-xl border border-brand-gray-mid bg-brand-black px-4 py-3 text-sm text-white outline-none transition focus:border-brand-red"
          />
          <div className="xl:col-span-6 flex items-center gap-3">
            <button
              type="submit"
              className="rounded-xl border border-brand-gray-mid px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-gray-mid"
            >
              Filtrar historico
            </button>
            <a
              href="/dashboard/presenca"
              className="rounded-xl px-4 py-3 text-sm text-brand-gray-light transition hover:text-white"
            >
              Limpar filtros
            </a>
          </div>
        </form>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Registros filtrados"
          value={data.summary.total}
          note="Total de presencas retornadas pelos filtros atuais."
        />
        <MetricCard
          label="Check-ins abertos"
          value={data.summary.byStatus.CHECKED_IN}
          note="Registros que ainda aguardam check-out."
        />
        <MetricCard
          label="Check-outs concluidos"
          value={data.summary.byStatus.CHECKED_OUT}
          note="Presencas encerradas no intervalo selecionado."
        />
        <MetricCard
          label="Faltas"
          value={data.summary.byStatus.NO_SHOW}
          note="Registros marcados como ausencia."
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-5">
          <h2 className="text-lg font-bold text-white">Visao por turma</h2>
          <div className="mt-4 space-y-3">
            {getTopEntries(data.summary.byClass).map(([label, count]) => (
              <div key={label} className="flex items-center justify-between text-sm text-white">
                <span>{label}</span>
                <StatusBadge tone="info">{count}</StatusBadge>
              </div>
            ))}
            {Object.keys(data.summary.byClass).length === 0 ? (
              <p className="text-sm text-brand-gray-light">
                Nenhum dado no periodo.
              </p>
            ) : null}
          </div>
        </article>
        <article className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-5">
          <h2 className="text-lg font-bold text-white">Visao por modalidade</h2>
          <div className="mt-4 space-y-3">
            {getTopEntries(data.summary.byModality).map(([label, count]) => (
              <div key={label} className="flex items-center justify-between text-sm text-white">
                <span>{label}</span>
                <StatusBadge tone="info">{count}</StatusBadge>
              </div>
            ))}
            {Object.keys(data.summary.byModality).length === 0 ? (
              <p className="text-sm text-brand-gray-light">
                Nenhum dado no periodo.
              </p>
            ) : null}
          </div>
        </article>
        <article className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-5">
          <h2 className="text-lg font-bold text-white">Visao por professor</h2>
          <div className="mt-4 space-y-3">
            {getTopEntries(data.summary.byTeacher).map(([label, count]) => (
              <div key={label} className="flex items-center justify-between text-sm text-white">
                <span>{label}</span>
                <StatusBadge tone="info">{count}</StatusBadge>
              </div>
            ))}
            {Object.keys(data.summary.byTeacher).length === 0 ? (
              <p className="text-sm text-brand-gray-light">
                Nenhum dado no periodo.
              </p>
            ) : null}
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Presenca do dia</h2>
            <p className="mt-1 text-sm text-brand-gray-light">
              Grade do dia para check-in e check-out rapido.
            </p>
          </div>
          <StatusBadge tone="info">{formatDate(data.today)}</StatusBadge>
        </div>

        <div className="mt-6 space-y-4">
          {data.todayClasses.map((classSchedule) => {
            const attendanceByStudentId = new Map(
              classSchedule.attendances.map((attendance) => [
                attendance.studentProfileId,
                attendance,
              ]),
            );

            return (
              <article
                key={classSchedule.id}
                className="rounded-3xl border border-brand-gray-mid bg-brand-black/30 p-5"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {classSchedule.title}
                    </h3>
                    <p className="mt-1 text-sm text-brand-gray-light">
                      {classSchedule.modality.name} • {classSchedule.teacherProfile.user.name}
                    </p>
                    <p className="mt-1 text-xs text-brand-gray-light">
                      {getWeekdayLabels(
                        classSchedule.daysOfWeek.length > 0
                          ? classSchedule.daysOfWeek
                          : [classSchedule.dayOfWeek],
                      ).join(", ")} • {classSchedule.startTime} - {classSchedule.endTime}
                    </p>
                  </div>
                  <StatusBadge tone="neutral">
                    {classSchedule.enrollments.length} aluno(s)
                  </StatusBadge>
                </div>

                {classSchedule.enrollments.length === 0 ? (
                  <p className="mt-4 text-sm text-brand-gray-light">
                    Nenhum aluno ativo vinculado a esta turma.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {classSchedule.enrollments.map((enrollment) => {
                      const todayAttendance = attendanceByStudentId.get(
                        enrollment.studentProfile.id,
                      );

                      return (
                        <div
                          key={enrollment.id}
                          className="rounded-2xl border border-brand-gray-mid bg-brand-black/40 p-4"
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-white">
                                  {enrollment.studentProfile.user.name}
                                </p>
                                {todayAttendance ? (
                                  <StatusBadge tone={getAttendanceStatusTone(todayAttendance.status)}>
                                    {getAttendanceStatusLabel(todayAttendance.status)}
                                  </StatusBadge>
                                ) : (
                                  <StatusBadge tone="neutral">Sem registro hoje</StatusBadge>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-brand-gray-light">
                                {enrollment.studentProfile.registrationNumber}
                              </p>
                              {todayAttendance ? (
                                <p className="mt-2 text-xs text-brand-gray-light">
                                  Check-in {formatDateTime(todayAttendance.checkedInAt)} • Check-out {formatDateTime(todayAttendance.checkedOutAt)}
                                </p>
                              ) : null}
                            </div>

                            {data.canManage ? (
                              todayAttendance?.status === "CHECKED_IN" ? (
                                <ApiActionButton
                                  endpoint="/api/attendance/check-out"
                                  payload={{ attendanceId: todayAttendance.id }}
                                  label="Registrar check-out"
                                  loadingLabel="Fechando..."
                                  variant="primary"
                                />
                              ) : todayAttendance?.status === "CHECKED_OUT" ? null : (
                                <ApiActionButton
                                  endpoint="/api/attendance/check-in"
                                  payload={{
                                    studentProfileId: enrollment.studentProfile.id,
                                    classScheduleId: classSchedule.id,
                                    classDate: todayString,
                                  }}
                                  label="Registrar check-in"
                                  loadingLabel="Registrando..."
                                  variant="primary"
                                />
                              )
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
        <h2 className="text-xl font-bold text-white">Historico filtrado</h2>
        {data.records.length === 0 ? (
          <p className="mt-4 text-sm text-brand-gray-light">
            Nenhum registro encontrado com os filtros selecionados.
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {data.records.map((record) => (
              <article
                key={record.id}
                className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-white">
                        {record.studentProfile.user.name}
                      </p>
                      <StatusBadge tone={getAttendanceStatusTone(record.status)}>
                        {getAttendanceStatusLabel(record.status)}
                      </StatusBadge>
                    </div>
                    <p className="mt-1 text-xs text-brand-gray-light">
                      {record.studentProfile.registrationNumber} • {record.classSchedule.title}
                    </p>
                    <p className="mt-1 text-xs text-brand-gray-light">
                      {record.classSchedule.modality.name} • {record.classSchedule.teacherProfile.user.name}
                    </p>
                  </div>
                  <div className="text-right text-xs text-brand-gray-light">
                    <p>{formatDate(record.classDate)}</p>
                    <p className="mt-1">
                      Check-in {formatDateTime(record.checkedInAt)} • Check-out {formatDateTime(record.checkedOutAt)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
