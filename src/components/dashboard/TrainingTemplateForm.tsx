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

type TrainingTemplateFormValues = {
  id?: string;
  name: string;
  slug: string;
  modalityId: string;
  teacherProfileId: string;
  level: string;
  description: string;
  objective: string;
  durationMinutes: string;
  aquecimento: string;
  blocoTecnico: string;
  blocoFisico: string;
  desaquecimento: string;
  rounds: string;
  series: string;
  repeticoes: string;
  tempo: string;
  observacoes: string;
  isActive: boolean;
};

type TrainingTemplateFormProps = {
  mode: "create" | "edit";
  endpoint: string;
  initialValues: TrainingTemplateFormValues;
  options: {
    modalities: Array<{ id: string; name: string }>;
    teachers: Array<{ id: string; user: { name: string } }>;
  };
};

export function TrainingTemplateForm({
  mode,
  endpoint,
  initialValues,
  options,
}: TrainingTemplateFormProps) {
  const router = useRouter();
  const { submit, isPending, error, message } = useApiMutation<
    Record<string, unknown>
  >({
    endpoint,
    method: mode === "create" ? "POST" : "PATCH",
    successMessage:
      mode === "create"
        ? "Modelo de treino criado com sucesso."
        : "Modelo de treino atualizado com sucesso.",
    onSuccess(data) {
      if (typeof data.templateId === "string") {
        router.push(`/dashboard/treinos/modelos/${data.templateId}`);
      }
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    submit({
      id: initialValues.id,
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      modalityId: String(formData.get("modalityId") ?? ""),
      teacherProfileId: String(formData.get("teacherProfileId") ?? ""),
      level: String(formData.get("level") ?? ""),
      description: String(formData.get("description") ?? ""),
      objective: String(formData.get("objective") ?? ""),
      durationMinutes: String(formData.get("durationMinutes") ?? ""),
      aquecimento: String(formData.get("aquecimento") ?? ""),
      blocoTecnico: String(formData.get("blocoTecnico") ?? ""),
      blocoFisico: String(formData.get("blocoFisico") ?? ""),
      desaquecimento: String(formData.get("desaquecimento") ?? ""),
      rounds: String(formData.get("rounds") ?? ""),
      series: String(formData.get("series") ?? ""),
      repeticoes: String(formData.get("repeticoes") ?? ""),
      tempo: String(formData.get("tempo") ?? ""),
      observacoes: String(formData.get("observacoes") ?? ""),
      isActive: Boolean(formData.get("isActive")),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="name" className={labelClassName}>
            Titulo do modelo
          </label>
          <input id="name" name="name" defaultValue={initialValues.name} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="slug" className={labelClassName}>
            Slug
          </label>
          <input id="slug" name="slug" defaultValue={initialValues.slug} className={inputClassName} />
          <p className={helperTextClassName}>
            Se ficar vazio, o sistema gera o slug a partir do titulo.
          </p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="modalityId" className={labelClassName}>
            Modalidade
          </label>
          <select
            id="modalityId"
            name="modalityId"
            defaultValue={initialValues.modalityId}
            className={selectClassName}
          >
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
            <option value="">Modelo geral da equipe</option>
            {options.teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.user.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="level" className={labelClassName}>
            Nivel
          </label>
          <input id="level" name="level" defaultValue={initialValues.level} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="durationMinutes" className={labelClassName}>
            Duracao estimada
          </label>
          <input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            min="1"
            step="1"
            defaultValue={initialValues.durationMinutes}
            className={inputClassName}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="objective" className={labelClassName}>
          Objetivo
        </label>
        <textarea
          id="objective"
          name="objective"
          defaultValue={initialValues.objective}
          className={textareaClassName}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className={labelClassName}>
          Contexto do treino
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={initialValues.description}
          className={textareaClassName}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="aquecimento" className={labelClassName}>
            Aquecimento
          </label>
          <textarea
            id="aquecimento"
            name="aquecimento"
            defaultValue={initialValues.aquecimento}
            className={textareaClassName}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="blocoTecnico" className={labelClassName}>
            Bloco tecnico
          </label>
          <textarea
            id="blocoTecnico"
            name="blocoTecnico"
            defaultValue={initialValues.blocoTecnico}
            className={textareaClassName}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="blocoFisico" className={labelClassName}>
            Bloco fisico
          </label>
          <textarea
            id="blocoFisico"
            name="blocoFisico"
            defaultValue={initialValues.blocoFisico}
            className={textareaClassName}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="desaquecimento" className={labelClassName}>
            Desaquecimento
          </label>
          <textarea
            id="desaquecimento"
            name="desaquecimento"
            defaultValue={initialValues.desaquecimento}
            className={textareaClassName}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="space-y-1.5">
          <label htmlFor="rounds" className={labelClassName}>
            Rounds
          </label>
          <input id="rounds" name="rounds" defaultValue={initialValues.rounds} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="series" className={labelClassName}>
            Series
          </label>
          <input id="series" name="series" defaultValue={initialValues.series} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="repeticoes" className={labelClassName}>
            Repeticoes
          </label>
          <input
            id="repeticoes"
            name="repeticoes"
            defaultValue={initialValues.repeticoes}
            className={inputClassName}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="tempo" className={labelClassName}>
            Tempo
          </label>
          <input id="tempo" name="tempo" defaultValue={initialValues.tempo} className={inputClassName} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="observacoes" className={labelClassName}>
          Observacoes
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          defaultValue={initialValues.observacoes}
          className={textareaClassName}
        />
        <p className={helperTextClassName}>
          Use uma linha por item nas secoes de execucao para facilitar a leitura no painel.
        </p>
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-brand-gray-mid bg-brand-black/30 px-4 py-3 text-sm text-white">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initialValues.isActive}
          className="h-4 w-4 accent-brand-red"
        />
        Modelo ativo para novas atribuicoes.
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
          {mode === "create" ? "Criar modelo" : "Salvar alteracoes"}
        </Button>
      </div>
    </form>
  );
}
