import type { Metadata } from "next";
import Link from "next/link";
import { LeadSource, LeadStatus } from "@prisma/client";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  LEAD_STATUS_LABELS,
  LeadStatusBadge,
} from "@/components/dashboard/leads/LeadStatusBadge";
import { Button } from "@/components/ui/Button";
import { getViewerContextFromSession } from "@/lib/academy/access";
import { flattenSearchParams } from "@/lib/academy/presentation";
import { requirePermission } from "@/lib/auth/guards";
import { formatCurrencyFromCents } from "@/lib/billing/constants";
import { listLeads } from "@/lib/leads/service";
import { leadFiltersSchema, parseSearchParams } from "@/lib/validators";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Leads",
  description:
    "Pipeline de prospects, qualificacao e historico de interacoes da equipe.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const SOURCE_LABELS: Record<LeadSource, string> = {
  WEBSITE: "Site",
  INSTAGRAM: "Instagram",
  WHATSAPP: "WhatsApp",
  REFERRAL: "Indicacao",
  WALK_IN: "Visita",
  PHONE: "Telefone",
  SOCIAL_MEDIA: "Redes",
  OTHER: "Outro",
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requirePermission("viewLeads");
  const viewer = await getViewerContextFromSession(session);
  const filters = parseSearchParams(
    flattenSearchParams(await searchParams),
    leadFiltersSchema,
  );
  const { items, pagination } = await listLeads(filters, viewer);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CRM"
        title="Pipeline de leads"
        description="Acompanhe prospects, registre interacoes e mova oportunidades pelo funil."
        action={
          <Link href="/dashboard/leads/novo">
            <Button type="button" size="md">
              Novo lead
            </Button>
          </Link>
        }
      />

      <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
        <form className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <input
            name="search"
            type="text"
            placeholder="Buscar por nome, e-mail, telefone..."
            defaultValue={filters.search ?? ""}
            className="rounded-xl border border-brand-gray-mid bg-brand-black px-4 py-3 text-sm text-white outline-none transition focus:border-brand-red md:col-span-2"
          />
          <select
            name="status"
            defaultValue={filters.status ?? ""}
            className="rounded-xl border border-brand-gray-mid bg-brand-black px-4 py-3 text-sm text-white outline-none transition focus:border-brand-red"
          >
            <option value="">Todos status</option>
            {Object.values(LeadStatus).map((status) => (
              <option key={status} value={status}>
                {LEAD_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <select
            name="source"
            defaultValue={filters.source ?? ""}
            className="rounded-xl border border-brand-gray-mid bg-brand-black px-4 py-3 text-sm text-white outline-none transition focus:border-brand-red"
          >
            <option value="">Todas origens</option>
            {Object.values(LeadSource).map((source) => (
              <option key={source} value={source}>
                {SOURCE_LABELS[source]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-xl bg-brand-red px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-red-dark"
          >
            Filtrar
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Leads cadastrados</h2>
          <p className="text-xs text-brand-gray-light">
            {pagination.totalItems} registro(s)
          </p>
        </div>

        {items.length === 0 ? (
          <p className="mt-4 text-sm text-brand-gray-light">
            Nenhum lead encontrado para o filtro atual.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-brand-gray-mid text-sm">
            {items.map((lead) => (
              <li
                key={lead.id}
                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/leads/${lead.id}`}
                      className="font-semibold text-white hover:text-brand-red"
                    >
                      {lead.name}
                    </Link>
                    <LeadStatusBadge status={lead.status} />
                    <span className="rounded-full border border-brand-white/10 bg-brand-white/5 px-2 py-0.5 text-[11px] text-brand-gray-light">
                      {SOURCE_LABELS[lead.source]}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-brand-gray-light">
                    {[lead.email, lead.phone, lead.instagramHandle]
                      .filter(Boolean)
                      .join(" - ") || "Sem contato cadastrado."}
                  </p>
                  <p className="mt-1 text-[11px] text-brand-gray-light">
                    Responsavel: {lead.assignedTo?.name ?? "Sem atribuicao"} -
                    Criado em {lead.createdAt.toISOString().slice(0, 10)} -
                    {" "}
                    {lead._count.interactions} interacao(es), {" "}
                    {lead._count.tasks} tarefa(s)
                  </p>
                </div>
                {lead.valueCents !== null && lead.valueCents !== undefined ? (
                  <span className="text-sm font-semibold text-white">
                    {formatCurrencyFromCents(lead.valueCents)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {pagination.totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-between text-xs text-brand-gray-light">
            <span>
              Pagina {pagination.page} de {pagination.totalPages}
            </span>
          </div>
        ) : null}
      </section>
    </div>
  );
}
