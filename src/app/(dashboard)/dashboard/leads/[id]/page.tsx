import type { Metadata } from "next";
import Link from "next/link";
import { LeadInteractionType } from "@prisma/client";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { LeadActions } from "@/components/dashboard/leads/LeadActions";
import { LeadInteractionForm } from "@/components/dashboard/leads/LeadInteractionForm";
import { LeadStatusBadge } from "@/components/dashboard/leads/LeadStatusBadge";
import { Button } from "@/components/ui/Button";
import { getViewerContextFromSession } from "@/lib/academy/access";
import { requirePermission } from "@/lib/auth/guards";
import { formatCurrencyFromCents } from "@/lib/billing/constants";
import { getLeadById } from "@/lib/leads/service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const INTERACTION_LABELS: Record<LeadInteractionType, string> = {
  NOTE: "Nota",
  CALL: "Ligacao",
  EMAIL: "E-mail",
  WHATSAPP: "WhatsApp",
  MEETING: "Reuniao",
  INSTAGRAM_DM: "Instagram DM",
};

export const metadata: Metadata = {
  title: "Detalhe do lead",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: RouteContext) {
  const { id } = await params;
  const session = await requirePermission("viewLeads");
  const viewer = await getViewerContextFromSession(session);
  const lead = await getLeadById(id, viewer);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CRM"
        title={lead.name}
        description="Pipeline, interacoes e tarefas vinculadas a este prospect."
        action={
          <Link href="/dashboard/leads">
            <Button type="button" variant="outline-dark" size="md">
              Voltar
            </Button>
          </Link>
        }
      />

      <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
        <div className="flex flex-wrap items-center gap-3">
          <LeadStatusBadge status={lead.status} />
          {lead.valueCents !== null && lead.valueCents !== undefined ? (
            <span className="rounded-full border border-brand-white/10 bg-brand-white/5 px-3 py-1 text-xs font-semibold text-brand-white">
              {formatCurrencyFromCents(lead.valueCents)}
            </span>
          ) : null}
          <span className="text-xs text-brand-gray-light">
            Origem: {lead.source}
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wider text-brand-gray-light">
              E-mail
            </dt>
            <dd className="text-white">{lead.email ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-brand-gray-light">
              Telefone
            </dt>
            <dd className="text-white">{lead.phone ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-brand-gray-light">
              Instagram
            </dt>
            <dd className="text-white">{lead.instagramHandle ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-brand-gray-light">
              Responsavel
            </dt>
            <dd className="text-white">{lead.assignedTo?.name ?? "-"}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-xs uppercase tracking-wider text-brand-gray-light">
              Observacoes
            </dt>
            <dd className="whitespace-pre-line text-white">
              {lead.notes ?? "-"}
            </dd>
          </div>
          {lead.status === "LOST" && lead.lostReason ? (
            <div className="md:col-span-2">
              <dt className="text-xs uppercase tracking-wider text-brand-red">
                Motivo da perda
              </dt>
              <dd className="whitespace-pre-line text-brand-white">
                {lead.lostReason}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-6">
          <LeadActions leadId={lead.id} status={lead.status} />
        </div>
      </section>

      <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
        <h2 className="text-lg font-bold text-white">Nova interacao</h2>
        <p className="mt-1 text-xs text-brand-gray-light">
          A primeira interacao move automaticamente o lead para "Contatado".
        </p>
        <div className="mt-4">
          <LeadInteractionForm leadId={lead.id} />
        </div>
      </section>

      <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
        <h2 className="text-lg font-bold text-white">
          Historico de interacoes
        </h2>
        {lead.interactions.length === 0 ? (
          <p className="mt-3 text-sm text-brand-gray-light">
            Sem interacoes registradas.
          </p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm">
            {lead.interactions.map((interaction) => (
              <li
                key={interaction.id}
                className="rounded-2xl border border-brand-gray-mid bg-brand-black/40 p-4"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-brand-gray-light">
                  <span className="rounded-full border border-brand-white/15 bg-brand-white/5 px-2 py-0.5 font-semibold text-brand-white">
                    {INTERACTION_LABELS[interaction.type]}
                  </span>
                  <span>{interaction.user?.name ?? "Sistema"}</span>
                  <span>
                    {interaction.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-line text-white">
                  {interaction.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
