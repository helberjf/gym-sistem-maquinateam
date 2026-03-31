"use client";

import { useRouter } from "next/navigation";
import { TrainingAssignmentStatus } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { useApiMutation } from "@/components/dashboard/useApiMutation";
import {
  helperTextClassName,
  inputClassName,
  labelClassName,
  selectClassName,
  textareaClassName,
} from "@/components/dashboard/styles";

const managerStatusOptions = [
  { value: TrainingAssignmentStatus.ASSIGNED, label: "Atribuido" },
  { value: TrainingAssignmentStatus.IN_PROGRESS, label: "Em andamento" },
  { value: TrainingAssignmentStatus.COMPLETED, label: "Concluido" },
  { value: TrainingAssignmentStatus.MISSED, label: "Nao realizado" },
  { value: TrainingAssignmentStatus.CANCELLED, label: "Cancelado" },
] as const;

const studentStatusOptions = [
  { value: TrainingAssignmentStatus.ASSIGNED, label: "Ainda nao iniciado" },
  { value: TrainingAssignmentStatus.IN_PROGRESS, label: "Marcar como lido" },
  { value: TrainingAssignmentStatus.COMPLETED, label: "Marcar como concluido" },
] as const;

type TrainingAssignmentFormValues = {
  id?: string;
  trainingTemplateId: string;
  studentIds: string[];
  teacherProfileId: string;
  title: string;
  instructions: string;
  objective: string;
  observacoesProfessor: string;
  assignedAt: string;
  dueAt: string;
  status: string;
  studentNotes: string;
  feedback: string;
};

type TrainingAssignmentFormProps = {
  mode: "create" | "edit";
  endpoint: string;
  initialValues: TrainingAssignmentFormValues;
  options?: {
    templates: Array<{
      id: string;
      name: string;
      level: string | null;
      modality: { name: string } | null;
    }>;
    students: Array<{
      id: string;
      registrationNumber: string;
      user: { name: string };
    }>;
    teachers: Array<{ id: string; user: { name: string } }>;
  };
  canManage: boolean;
  isStudentOwner?: boolean;
};

export function TrainingAssignmentForm({
  mode,
  endpoint,
  initialValues,
  options,
  canManage,
  isStudentOwner = false,
}: TrainingAssignmentFormProps) {
  const router = useRouter();
  const { submit, isPending, error, message } = useApiMutation<
    Record<string, unknown>
  >({
    endpoint,
    method: mode === "create" ? "POST" : "PATCH",
    successMessage:
      mode === "create"
        ? "Treino atribuido com sucesso."
        : "Treino atualizado com sucesso.",
    onSuccess(data) {
      if (mode === "create") {
        const assignmentIds = Array.isArray(data.assignmentIds)
          ? data.assignmentIds
          : [];

        if (
          assignmentIds.length === 1 &&
          typeof assignmentIds[0] === "string"
        ) {
          router.push(`/dashboard/treinos/atribuicoes/${assignmentIds[0]}`);
          return;
        }

        router.push("/dashboard/treinos");
        return;
      }

      if (typeof data.assignmentId === "string") {
        router.push(`/dashboard/treinos/atribuicoes/${data.assignmentId}`);
      }
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (mode === "create") {
      submit({
        trainingTemplateId: String(formData.get("trainingTemplateId") ?? ""),
        studentIds: formData.getAll("studentIds").map((item) => String(item)),
        teacherProfileId: String(formData.get("teacherProfileId") ?? ""),
        title: String(formData.get("title") ?? ""),
        instructions: String(formData.get("instructions") ?? ""),
        objective: String(formData.get("objective") ?? ""),
        observacoesProfessor: String(formData.get("observacoesProfessor") ?? ""),
        assignedAt: String(formData.get("assignedAt") ?? ""),
        dueAt: String(formData.get("dueAt") ?? ""),
        status: String(formData.get("status") ?? TrainingAssignmentStatus.ASSIGNED),
      });
      return;
    }

    submit({
      id: initialValues.id,
      title: String(formData.get("title") ?? ""),
      instructions: String(formData.get("instructions") ?? ""),
      dueAt: String(formData.get("dueAt") ?? ""),
      status: String(formData.get("status") ?? initialValues.status),
      studentNotes: String(formData.get("studentNotes") ?? ""),
      feedback: String(formData.get("feedback") ?? ""),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mode === "create" ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="trainingTemplateId" className={labelClassName}>
                Modelo base
              </label>
              <select
                id="trainingTemplateId"
                name="trainingTemplateId"
                defaultValue={initialValues.trainingTemplateId}
                className={selectClassName}
              >
                <option value="">Selecione</option>
                {options?.templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} • {template.modality?.name ?? "Modalidade livre"}
                    {template.level ? ` • ${template.level}` : ""}
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
                <option value="">Usar responsavel do modelo</option>
                {options?.teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.user.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="title" className={labelClassName}>
                Titulo personalizado
              </label>
              <input id="title" name="title" defaultValue={initialValues.title} className={inputClassName} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="status" className={labelClassName}>
                Status inicial
              </label>
              <select
                id="status"
                name="status"
                defaultValue={initialValues.status}
                className={selectClassName}
              >
                {managerStatusOptions
                  .filter(
                    (option) =>
                      option.value === TrainingAssignmentStatus.ASSIGNED ||
                      option.value === TrainingAssignmentStatus.IN_PROGRESS,
                  )
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="assignedAt" className={labelClassName}>
                Data de atribuicao
              </label>
              <input
                id="assignedAt"
                name="assignedAt"
                type="date"
                defaultValue={initialValues.assignedAt}
                className={inputClassName}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="dueAt" className={labelClassName}>
                Validade opcional
              </label>
              <input
                id="dueAt"
                name="dueAt"
                type="date"
                defaultValue={initialValues.dueAt}
                className={inputClassName}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="objective" className={labelClassName}>
              Objetivo do treino
            </label>
            <textarea
              id="objective"
              name="objective"
              defaultValue={initialValues.objective}
              className={textareaClassName}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="instructions" className={labelClassName}>
              Instrucoes para o aluno
            </label>
            <textarea
              id="instructions"
              name="instructions"
              defaultValue={initialValues.instructions}
              className={textareaClassName}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="observacoesProfessor" className={labelClassName}>
              Observacoes do professor
            </label>
            <textarea
              id="observacoesProfessor"
              name="observacoesProfessor"
              defaultValue={initialValues.observacoesProfessor}
              className={textareaClassName}
            />
          </div>

          <div className="space-y-3">
            <div>
              <p className={labelClassName}>Alunos</p>
              <p className={helperTextClassName}>
                Selecione um ou mais alunos para reutilizar o mesmo treino.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {options?.students.map((student) => (
                <label
                  key={student.id}
                  className="flex items-center gap-3 rounded-2xl border border-brand-gray-mid bg-brand-black/30 px-4 py-3 text-sm text-white"
                >
                  <input
                    type="checkbox"
                    name="studentIds"
                    value={student.id}
                    defaultChecked={initialValues.studentIds.includes(student.id)}
                    className="h-4 w-4 accent-brand-red"
                  />
                  <span>
                    {student.user.name} • {student.registrationNumber}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {canManage && !isStudentOwner ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="title" className={labelClassName}>
                  Titulo
                </label>
                <input
                  id="title"
                  name="title"
                  defaultValue={initialValues.title}
                  className={inputClassName}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="status" className={labelClassName}>
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={initialValues.status}
                  className={selectClassName}
                >
                  {managerStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="instructions" className={labelClassName}>
                  Instrucoes
                </label>
                <textarea
                  id="instructions"
                  name="instructions"
                  defaultValue={initialValues.instructions}
                  className={textareaClassName}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="dueAt" className={labelClassName}>
                  Validade
                </label>
                <input
                  id="dueAt"
                  name="dueAt"
                  type="date"
                  defaultValue={initialValues.dueAt}
                  className={inputClassName}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="feedback" className={labelClassName}>
                  Feedback do professor
                </label>
                <textarea
                  id="feedback"
                  name="feedback"
                  defaultValue={initialValues.feedback}
                  className={textareaClassName}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="status" className={labelClassName}>
                  Progresso
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={initialValues.status}
                  className={selectClassName}
                >
                  {studentStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="studentNotes" className={labelClassName}>
              Anotacoes do aluno
            </label>
            <textarea
              id="studentNotes"
              name="studentNotes"
              defaultValue={initialValues.studentNotes}
              className={textareaClassName}
            />
          </div>
        </>
      )}

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
          {mode === "create"
            ? "Atribuir treino"
            : isStudentOwner
              ? "Salvar progresso"
              : "Salvar alteracoes"}
        </Button>
      </div>
    </form>
  );
}
