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
import { PLAN_INTERVAL_OPTIONS } from "@/lib/billing/constants";

type PlanFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  benefits: string;
  modalityId: string;
  price: string;
  billingIntervalMonths: string;
  durationMonths: string;
  sessionsPerWeek: string;
  enrollmentFee: string;
  isUnlimited: boolean;
  active: boolean;
};

type PlanFormProps = {
  mode: "create" | "edit";
  endpoint: string;
  initialValues: PlanFormValues;
  options: {
    modalities: Array<{ id: string; name: string }>;
  };
};

export function PlanForm({
  mode,
  endpoint,
  initialValues,
  options,
}: PlanFormProps) {
  const router = useRouter();
  const { submit, isPending, error, message } = useApiMutation<
    Record<string, unknown>
  >({
    endpoint,
    method: mode === "create" ? "POST" : "PATCH",
    successMessage:
      mode === "create" ? "Plano criado com sucesso." : "Plano atualizado com sucesso.",
    onSuccess(data) {
      if (mode === "create" && typeof data.planId === "string") {
        router.push(`/dashboard/planos/${data.planId}`);
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
      description: String(formData.get("description") ?? ""),
      benefits: String(formData.get("benefits") ?? ""),
      modalityId: String(formData.get("modalityId") ?? ""),
      priceCents: String(formData.get("priceCents") ?? ""),
      billingIntervalMonths: String(formData.get("billingIntervalMonths") ?? "1"),
      durationMonths: String(formData.get("durationMonths") ?? ""),
      sessionsPerWeek: String(formData.get("sessionsPerWeek") ?? ""),
      enrollmentFeeCents: String(formData.get("enrollmentFeeCents") ?? "0"),
      isUnlimited: Boolean(formData.get("isUnlimited")),
      active: Boolean(formData.get("active")),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="name" className={labelClassName}>
            Nome
          </label>
          <input id="name" name="name" defaultValue={initialValues.name} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="slug" className={labelClassName}>
            Slug
          </label>
          <input id="slug" name="slug" defaultValue={initialValues.slug} className={inputClassName} />
          <p className={helperTextClassName}>
            Se ficar em branco, o sistema gera automaticamente a partir do nome.
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
            <option value="">Plano geral da academia</option>
            {options.modalities.map((modality) => (
              <option key={modality.id} value={modality.id}>
                {modality.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="priceCents" className={labelClassName}>
            Preco (R$)
          </label>
          <input
            id="priceCents"
            name="priceCents"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initialValues.price}
            className={inputClassName}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="billingIntervalMonths" className={labelClassName}>
            Recorrencia
          </label>
          <select
            id="billingIntervalMonths"
            name="billingIntervalMonths"
            defaultValue={initialValues.billingIntervalMonths}
            className={selectClassName}
          >
            {PLAN_INTERVAL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="durationMonths" className={labelClassName}>
            Duracao do contrato
          </label>
          <input
            id="durationMonths"
            name="durationMonths"
            type="number"
            min="1"
            step="1"
            defaultValue={initialValues.durationMonths}
            className={inputClassName}
          />
          <p className={helperTextClassName}>
            Deixe em branco para usar a mesma duracao da recorrencia.
          </p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="sessionsPerWeek" className={labelClassName}>
            Sessoes por semana
          </label>
          <input
            id="sessionsPerWeek"
            name="sessionsPerWeek"
            type="number"
            min="1"
            step="1"
            defaultValue={initialValues.sessionsPerWeek}
            className={inputClassName}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="enrollmentFeeCents" className={labelClassName}>
            Taxa de matricula (R$)
          </label>
          <input
            id="enrollmentFeeCents"
            name="enrollmentFeeCents"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initialValues.enrollmentFee}
            className={inputClassName}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className={labelClassName}>
          Descricao
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={initialValues.description}
          className={textareaClassName}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="benefits" className={labelClassName}>
          Beneficios
        </label>
        <textarea
          id="benefits"
          name="benefits"
          defaultValue={initialValues.benefits}
          className={textareaClassName}
        />
        <p className={helperTextClassName}>
          Use uma linha por beneficio para facilitar a leitura no painel do aluno.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="flex items-center gap-3 rounded-2xl border border-brand-gray-mid bg-brand-black/30 px-4 py-3 text-sm text-white">
          <input
            type="checkbox"
            name="isUnlimited"
            defaultChecked={initialValues.isUnlimited}
            className="h-4 w-4 accent-brand-red"
          />
          Acesso ilimitado dentro da recorrencia.
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-brand-gray-mid bg-brand-black/30 px-4 py-3 text-sm text-white">
          <input
            type="checkbox"
            name="active"
            defaultChecked={initialValues.active}
            className="h-4 w-4 accent-brand-red"
          />
          Plano ativo para novas assinaturas.
        </label>
      </div>

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
          {mode === "create" ? "Criar plano" : "Salvar alteracoes"}
        </Button>
      </div>
    </form>
  );
}
