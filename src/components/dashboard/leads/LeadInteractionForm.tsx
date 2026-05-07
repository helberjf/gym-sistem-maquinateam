"use client";

import { useRef } from "react";
import { LeadInteractionType } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import {
  inputClassName,
  labelClassName,
  textareaClassName,
} from "@/components/dashboard/styles";
import { useApiMutation } from "@/components/dashboard/useApiMutation";

type Props = {
  leadId: string;
};

const TYPE_LABELS: Record<LeadInteractionType, string> = {
  NOTE: "Nota",
  CALL: "Ligacao",
  EMAIL: "E-mail",
  WHATSAPP: "WhatsApp",
  MEETING: "Reuniao",
  INSTAGRAM_DM: "Instagram DM",
};

type Payload = { type: LeadInteractionType; content: string };

export function LeadInteractionForm({ leadId }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const { submit, isPending, error } = useApiMutation<Payload>({
    endpoint: `/api/leads/${leadId}/interactions`,
    method: "POST",
    successMessage: "Interacao registrada.",
    onSuccess() {
      formRef.current?.reset();
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const content = String(data.get("content") ?? "").trim();
    if (!content) return;
    submit({
      type: (data.get("type") as LeadInteractionType) ??
        LeadInteractionType.NOTE,
      content,
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[180px_1fr]">
        <div className="space-y-1.5">
          <label htmlFor="type" className={labelClassName}>
            Tipo
          </label>
          <select
            id="type"
            name="type"
            defaultValue={LeadInteractionType.NOTE}
            className={inputClassName}
          >
            {Object.values(LeadInteractionType).map((value) => (
              <option key={value} value={value}>
                {TYPE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="content" className={labelClassName}>
            Conteudo
          </label>
          <textarea
            id="content"
            name="content"
            required
            maxLength={4000}
            placeholder="O que aconteceu? Proximo passo?"
            className={textareaClassName}
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-brand-gray-light/20 bg-brand-black/70 px-4 py-3 text-sm text-brand-white">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" size="md" loading={isPending}>
          Registrar interacao
        </Button>
      </div>
    </form>
  );
}
