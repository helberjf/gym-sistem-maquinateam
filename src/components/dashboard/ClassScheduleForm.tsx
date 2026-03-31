"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useApiMutation } from "@/components/dashboard/useApiMutation";
import {
  helperTextClassName,
  inputClassName,
  labelClassName,
  selectClassName,
  textareaClassName,
} from "@/components/dashboard/styles";

const weekdayOptions = [
  { value: "1", label: "Segunda" },
  { value: "2", label: "Terca" },
  { value: "3", label: "Quarta" },
  { value: "4", label: "Quinta" },
  { value: "5", label: "Sexta" },
  { value: "6", label: "Sabado" },
  { value: "0", label: "Domingo" },
];

type ClassScheduleFormValues = {
  id?: string;
  title: string;
  description: string;
  modalityId: string;
  teacherProfileId: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  room: string;
  capacity: string;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  studentIds: string[];
};

type ClassScheduleFormProps = {
  mode: "create" | "edit";
  endpoint: string;
  initialValues: ClassScheduleFormValues;
  options: {
    modalities: Array<{ id: string; name: string }>;
    teachers: Array<{ id: string; name: string }>;
    students: Array<{ id: string; registrationNumber: string; name: string }>;
  };
};

export function ClassScheduleForm({
  mode,
  endpoint,
  initialValues,
  options,
}: ClassScheduleFormProps) {
  const router = useRouter();
  const { submit, isPending, error, message } = useApiMutation<
    Record<string, unknown>
  >({
    endpoint,
    method: mode === "create" ? "POST" : "PATCH",
    successMessage:
      mode === "create" ? "Turma criada com sucesso." : "Turma atualizada com sucesso.",
    onSuccess(data) {
      if (mode === "create" && typeof data.classScheduleId === "string") {
        router.push(`/dashboard/turmas/${data.classScheduleId}`);
      }
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    submit({
      id: initialValues.id,
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      modalityId: String(formData.get("modalityId") ?? ""),
      teacherProfileId: String(formData.get("teacherProfileId") ?? ""),
      daysOfWeek: formData.getAll("daysOfWeek").map((value) => Number(value)),
      startTime: String(formData.get("startTime") ?? ""),
      endTime: String(formData.get("endTime") ?? ""),
      room: String(formData.get("room") ?? ""),
      capacity: String(formData.get("capacity") ?? ""),
      validFrom: String(formData.get("validFrom") ?? ""),
      validUntil: String(formData.get("validUntil") ?? ""),
      isActive: Boolean(formData.get("isActive")),
      studentIds: formData.getAll("studentIds").map(String),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5 md:col-span-2">
          <label htmlFor="title" className={labelClassName}>
            Nome da turma
          </label>
          <input id="title" name="title" defaultValue={initialValues.title} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="modalityId" className={labelClassName}>
            Modalidade
          </label>
          <select id="modalityId" name="modalityId" defaultValue={initialValues.modalityId} className={selectClassName}>
            <option value="">Selecione</option>
            {options.modalities.map((modality) => (
              <option key={modality.id} value={modality.id}>
                {modality.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="teacherProfileId" className={labelClassName}>
            Professor responsavel
          </label>
          <select
            id="teacherProfileId"
            name="teacherProfileId"
            defaultValue={initialValues.teacherProfileId}
            className={selectClassName}
          >
            <option value="">Selecione</option>
            {options.teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="startTime" className={labelClassName}>
            Inicio
          </label>
          <input id="startTime" name="startTime" type="time" defaultValue={initialValues.startTime} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="endTime" className={labelClassName}>
            Fim
          </label>
          <input id="endTime" name="endTime" type="time" defaultValue={initialValues.endTime} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="room" className={labelClassName}>
            Sala
          </label>
          <input id="room" name="room" defaultValue={initialValues.room} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="capacity" className={labelClassName}>
            Capacidade
          </label>
          <input id="capacity" name="capacity" type="number" defaultValue={initialValues.capacity} className={inputClassName} />
          <p className={helperTextClassName}>Deixe vazio para operar sem limite definido.</p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="validFrom" className={labelClassName}>
            Valida a partir de
          </label>
          <input id="validFrom" name="validFrom" type="date" defaultValue={initialValues.validFrom} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="validUntil" className={labelClassName}>
            Valida ate
          </label>
          <input id="validUntil" name="validUntil" type="date" defaultValue={initialValues.validUntil} className={inputClassName} />
        </div>
      </div>

      <div className="space-y-3">
        <p className={labelClassName}>Dias da semana</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {weekdayOptions.map((weekday) => (
            <label
              key={weekday.value}
              className="flex items-center gap-3 rounded-2xl border border-brand-gray-mid bg-brand-black/30 px-4 py-3 text-sm text-white"
            >
              <input
                type="checkbox"
                name="daysOfWeek"
                value={weekday.value}
                defaultChecked={initialValues.daysOfWeek.includes(weekday.value)}
                className="h-4 w-4 accent-brand-red"
              />
              {weekday.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className={labelClassName}>
          Descricao
        </label>
        <textarea id="description" name="description" defaultValue={initialValues.description} className={textareaClassName} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="studentIds" className={labelClassName}>
          Alunos vinculados
        </label>
        <select
          id="studentIds"
          name="studentIds"
          multiple
          defaultValue={initialValues.studentIds}
          className={`${selectClassName} min-h-56`}
        >
          {options.students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name} ({student.registrationNumber})
            </option>
          ))}
        </select>
        <p className={helperTextClassName}>
          Use Ctrl ou Command para selecionar varios alunos da turma.
        </p>
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-brand-gray-mid bg-brand-black/30 px-4 py-3 text-sm text-white">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initialValues.isActive}
          className="h-4 w-4 accent-brand-red"
        />
        Turma ativa para matriculas e presenca.
      </label>

      {error ? (
        <div className="rounded-2xl border border-brand-gray-light/20 bg-brand-black/70 px-4 py-3 text-sm text-brand-white">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-2xl border border-brand-white/15 bg-brand-white/5 px-4 py-3 text-sm text-brand-white">
          {message}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" size="lg" loading={isPending}>
          {mode === "create" ? "Criar turma" : "Salvar alteracoes"}
        </Button>
      </div>
    </form>
  );
}
