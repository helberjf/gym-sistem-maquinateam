"use client";

import { useState } from "react";
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
import {
  PAYMENT_FORM_STATUS_OPTIONS,
} from "@/lib/billing/constants";

const paymentMethodFormOptions = [
  { value: "PIX", label: "PIX" },
  { value: "CASH", label: "Dinheiro" },
  { value: "CREDIT_CARD", label: "Cartao" },
  { value: "BANK_TRANSFER", label: "Transferencia" },
  { value: "BOLETO", label: "Outro" },
] as const;

type PaymentFormValues = {
  id?: string;
  studentProfileId: string;
  subscriptionId: string;
  amount: string;
  status: string;
  method: string;
  dueDate: string;
  paidAt: string;
  description: string;
  notes: string;
};

type PaymentFormProps = {
  mode: "create" | "edit";
  endpoint: string;
  initialValues: PaymentFormValues;
  options: {
    students: Array<{ id: string; name: string; registrationNumber: string }>;
    subscriptions: Array<{
      id: string;
      studentProfileId: string;
      studentName: string;
      registrationNumber: string;
      planName: string;
      status: string;
    }>;
  };
};

export function PaymentForm({
  mode,
  endpoint,
  initialValues,
  options,
}: PaymentFormProps) {
  const router = useRouter();
  const [selectedStudentId, setSelectedStudentId] = useState(
    initialValues.studentProfileId,
  );
  const { submit, isPending, error, message } = useApiMutation<
    Record<string, unknown>
  >({
    endpoint,
    method: mode === "create" ? "POST" : "PATCH",
    successMessage:
      mode === "create" ? "Pagamento criado com sucesso." : "Pagamento atualizado com sucesso.",
    onSuccess(data) {
      if (mode === "create" && typeof data.paymentId === "string") {
        router.push(`/dashboard/pagamentos/${data.paymentId}`);
      }
    },
  });

  const filteredSubscriptions = selectedStudentId
    ? options.subscriptions.filter(
        (subscription) => subscription.studentProfileId === selectedStudentId,
      )
    : options.subscriptions;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    submit({
      id: initialValues.id,
      studentProfileId: String(formData.get("studentProfileId") ?? ""),
      subscriptionId: String(formData.get("subscriptionId") ?? ""),
      amountCents: String(formData.get("amountCents") ?? ""),
      status: String(formData.get("status") ?? "PENDING"),
      method: String(formData.get("method") ?? "PIX"),
      dueDate: String(formData.get("dueDate") ?? ""),
      paidAt: String(formData.get("paidAt") ?? ""),
      description: String(formData.get("description") ?? ""),
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
            value={selectedStudentId}
            onChange={(event) => setSelectedStudentId(event.target.value)}
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
          <label htmlFor="subscriptionId" className={labelClassName}>
            Assinatura
          </label>
          <select
            key={selectedStudentId || "all-subscriptions"}
            id="subscriptionId"
            name="subscriptionId"
            defaultValue={initialValues.subscriptionId}
            className={selectClassName}
          >
            <option value="">Selecione uma assinatura</option>
            {filteredSubscriptions.map((subscription) => (
              <option key={subscription.id} value={subscription.id}>
                {subscription.studentName} • {subscription.planName}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="amountCents" className={labelClassName}>
            Valor (R$)
          </label>
          <input
            id="amountCents"
            name="amountCents"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initialValues.amount}
            className={inputClassName}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="status" className={labelClassName}>
            Status
          </label>
          <select id="status" name="status" defaultValue={initialValues.status} className={selectClassName}>
            {PAYMENT_FORM_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="method" className={labelClassName}>
            Metodo
          </label>
          <select id="method" name="method" defaultValue={initialValues.method} className={selectClassName}>
            {paymentMethodFormOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="dueDate" className={labelClassName}>
            Vencimento
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={initialValues.dueDate}
            className={inputClassName}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="paidAt" className={labelClassName}>
            Data do pagamento
          </label>
          <input
            id="paidAt"
            name="paidAt"
            type="date"
            defaultValue={initialValues.paidAt}
            className={inputClassName}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="description" className={labelClassName}>
            Descricao
          </label>
          <input
            id="description"
            name="description"
            defaultValue={initialValues.description}
            className={inputClassName}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="notes" className={labelClassName}>
          Observacoes
        </label>
        <textarea id="notes" name="notes" defaultValue={initialValues.notes} className={textareaClassName} />
        <p className={helperTextClassName}>
          Use observacoes para registrar acordos, comprovantes ou contexto da cobranca.
        </p>
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
          {mode === "create" ? "Criar pagamento" : "Salvar alteracoes"}
        </Button>
      </div>
    </form>
  );
}
