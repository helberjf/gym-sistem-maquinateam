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
import { SUBSCRIPTION_STATUS_OPTIONS } from "@/lib/billing/constants";

type SubscriptionFormValues = {
  id?: string;
  studentProfileId: string;
  planId: string;
  status: string;
  startDate: string;
  endDate: string;
  renewalDay: string;
  autoRenew: boolean;
  price: string;
  discount: string;
  notes: string;
};

type SubscriptionFormProps = {
  mode: "create" | "edit";
  endpoint: string;
  initialValues: SubscriptionFormValues;
  options: {
    students: Array<{ id: string; name: string; registrationNumber: string }>;
    plans: Array<{ id: string; name: string; priceCents: number }>;
  };
};

export function SubscriptionForm({
  mode,
  endpoint,
  initialValues,
  options,
}: SubscriptionFormProps) {
  const router = useRouter();
  const { submit, isPending, error, message } = useApiMutation<
    Record<string, unknown>
  >({
    endpoint,
    method: mode === "create" ? "POST" : "PATCH",
    successMessage:
      mode === "create"
        ? "Assinatura criada com sucesso."
        : "Assinatura atualizada com sucesso.",
    onSuccess(data) {
      if (mode === "create" && typeof data.subscriptionId === "string") {
        router.push(`/dashboard/assinaturas/${data.subscriptionId}`);
      }
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    submit({
      id: initialValues.id,
      studentProfileId: String(formData.get("studentProfileId") ?? ""),
      planId: String(formData.get("planId") ?? ""),
      status: String(formData.get("status") ?? "ACTIVE"),
      startDate: String(formData.get("startDate") ?? ""),
      endDate: String(formData.get("endDate") ?? ""),
      renewalDay: String(formData.get("renewalDay") ?? ""),
      autoRenew: Boolean(formData.get("autoRenew")),
      priceCents: String(formData.get("priceCents") ?? ""),
      discountCents: String(formData.get("discountCents") ?? "0"),
      notes: String(formData.get("notes") ?? ""),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="studentProfileId" className={labelClassName}>
            Aluno
          </label>
          <select
            id="studentProfileId"
            name="studentProfileId"
            defaultValue={initialValues.studentProfileId}
            className={selectClassName}
          >
            <option value="">Selecione um aluno</option>
            {options.students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} • {student.registrationNumber}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="planId" className={labelClassName}>
            Plano
          </label>
          <select
            id="planId"
            name="planId"
            defaultValue={initialValues.planId}
            className={selectClassName}
          >
            <option value="">Selecione um plano</option>
            {options.plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="status" className={labelClassName}>
            Status
          </label>
          <select id="status" name="status" defaultValue={initialValues.status} className={selectClassName}>
            {SUBSCRIPTION_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="renewalDay" className={labelClassName}>
            Dia de renovacao
          </label>
          <input
            id="renewalDay"
            name="renewalDay"
            type="number"
            min="1"
            max="31"
            step="1"
            defaultValue={initialValues.renewalDay}
            className={inputClassName}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="startDate" className={labelClassName}>
            Inicio
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={initialValues.startDate}
            className={inputClassName}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="endDate" className={labelClassName}>
            Termino
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={initialValues.endDate}
            className={inputClassName}
          />
          <p className={helperTextClassName}>
            Se ficar vazio, o sistema usa a duracao configurada no plano.
          </p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="priceCents" className={labelClassName}>
            Valor base (R$)
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
          <label htmlFor="discountCents" className={labelClassName}>
            Desconto (R$)
          </label>
          <input
            id="discountCents"
            name="discountCents"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initialValues.discount}
            className={inputClassName}
          />
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-brand-gray-mid bg-brand-black/30 px-4 py-3 text-sm text-white">
        <input
          type="checkbox"
          name="autoRenew"
          defaultChecked={initialValues.autoRenew}
          className="h-4 w-4 accent-brand-red"
        />
        Renovacao automatica habilitada.
      </label>

      <div className="space-y-1.5">
        <label htmlFor="notes" className={labelClassName}>
          Observacoes
        </label>
        <textarea id="notes" name="notes" defaultValue={initialValues.notes} className={textareaClassName} />
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
          {mode === "create" ? "Criar assinatura" : "Salvar alteracoes"}
        </Button>
      </div>
    </form>
  );
}
