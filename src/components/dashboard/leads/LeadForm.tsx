"use client";

import { useRef } from "react";
import { LeadSource } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import {
  inputClassName,
  labelClassName,
  textareaClassName,
} from "@/components/dashboard/styles";
import { useApiMutation } from "@/components/dashboard/useApiMutation";

type AssigneeOption = {
  id: string;
  label: string;
};

type LeadFormProps = {
  assigneeOptions: AssigneeOption[];
  defaultAssigneeId?: string;
};

type Payload = {
  name: string;
  email?: string;
  phone?: string;
  instagramHandle?: string;
  source: LeadSource;
  valueCents?: number | null;
  notes?: string;
  assignedToId?: string;
};

const SOURCE_LABELS: Record<LeadSource, string> = {
  WEBSITE: "Site",
  INSTAGRAM: "Instagram",
  WHATSAPP: "WhatsApp",
  REFERRAL: "Indicacao",
  WALK_IN: "Visita presencial",
  PHONE: "Telefone",
  SOCIAL_MEDIA: "Redes sociais",
  OTHER: "Outro",
};

function parseAmountToCents(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/\./g, "").replace(/,/g, ".");
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return Math.round(numeric * 100);
}

export function LeadForm({
  assigneeOptions,
  defaultAssigneeId,
}: LeadFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { submit, isPending, error, message } = useApiMutation<Payload>({
    endpoint: "/api/leads",
    method: "POST",
    redirectTo: "/dashboard/leads",
    successMessage: "Lead criado com sucesso.",
    onSuccess() {
      formRef.current?.reset();
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload: Payload = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim() || undefined,
      phone: String(data.get("phone") ?? "").trim() || undefined,
      instagramHandle:
        String(data.get("instagramHandle") ?? "").trim() || undefined,
      source: (data.get("source") as LeadSource) ?? LeadSource.OTHER,
      valueCents: parseAmountToCents(String(data.get("amount") ?? "")),
      notes: String(data.get("notes") ?? "").trim() || undefined,
      assignedToId:
        String(data.get("assignedToId") ?? "").trim() || undefined,
    };
    submit(payload);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5 md:col-span-2">
          <label htmlFor="name" className={labelClassName}>
            Nome do contato *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={120}
            autoComplete="name"
            className={inputClassName}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className={labelClassName}>
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            maxLength={200}
            autoComplete="email"
            className={inputClassName}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="phone" className={labelClassName}>
            Telefone / WhatsApp
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            maxLength={40}
            autoComplete="tel"
            className={inputClassName}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="instagramHandle" className={labelClassName}>
            Instagram
          </label>
          <input
            id="instagramHandle"
            name="instagramHandle"
            type="text"
            maxLength={80}
            placeholder="@usuario"
            className={inputClassName}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="source" className={labelClassName}>
            Origem
          </label>
          <select
            id="source"
            name="source"
            defaultValue={LeadSource.OTHER}
            className={inputClassName}
          >
            {Object.values(LeadSource).map((value) => (
              <option key={value} value={value}>
                {SOURCE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="amount" className={labelClassName}>
            Valor estimado (R$)
          </label>
          <input
            id="amount"
            name="amount"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            className={inputClassName}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="assignedToId" className={labelClassName}>
            Responsavel
          </label>
          <select
            id="assignedToId"
            name="assignedToId"
            defaultValue={defaultAssigneeId ?? ""}
            className={inputClassName}
          >
            {assigneeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="notes" className={labelClassName}>
          Observacoes
        </label>
        <textarea
          id="notes"
          name="notes"
          maxLength={4000}
          placeholder="Detalhes do interesse, plano desejado, dores, follow-up..."
          className={textareaClassName}
        />
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
          Criar lead
        </Button>
      </div>
    </form>
  );
}
