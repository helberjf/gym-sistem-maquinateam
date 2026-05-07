import { LeadStatus } from "@prisma/client";

const LABELS: Record<LeadStatus, string> = {
  NEW: "Novo",
  CONTACTED: "Contatado",
  QUALIFIED: "Qualificado",
  PROPOSAL: "Proposta",
  NEGOTIATION: "Negociacao",
  WON: "Ganho",
  LOST: "Perdido",
};

const TONE: Record<LeadStatus, string> = {
  NEW: "border-brand-white/15 bg-brand-white/5 text-brand-white",
  CONTACTED: "border-brand-white/15 bg-brand-white/5 text-brand-white",
  QUALIFIED: "border-brand-white/20 bg-brand-white/10 text-brand-white",
  PROPOSAL: "border-brand-white/20 bg-brand-white/10 text-brand-white",
  NEGOTIATION:
    "border-brand-red/40 bg-brand-red/10 text-brand-red",
  WON: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300",
  LOST: "border-brand-gray-light/30 bg-brand-gray-mid/40 text-brand-gray-light",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${TONE[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}

export const LEAD_STATUS_LABELS = LABELS;
