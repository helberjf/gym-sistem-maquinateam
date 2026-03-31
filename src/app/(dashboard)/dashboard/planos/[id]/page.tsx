import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { ApiActionButton } from "@/components/dashboard/ApiActionButton";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PlanForm } from "@/components/dashboard/PlanForm";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { getViewerContextFromSession } from "@/lib/academy/access";
import { formatDate } from "@/lib/academy/constants";
import {
  formatCurrencyFromCents,
  formatMonthsLabel,
  getBillingIntervalLabel,
  getSubscriptionStatusLabel,
} from "@/lib/billing/constants";
import {
  getPlanStatusTone,
  getSubscriptionStatusTone,
} from "@/lib/billing/presentation";
import { getPlanDetailData } from "@/lib/billing/service";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Detalhes do plano",
  description: "Parametros comerciais, beneficios e assinaturas vinculadas.",
};

type RouteParams = Promise<{ id: string }>;

export default async function PlanDetailPage({
  params,
}: {
  params: RouteParams;
}) {
  const session = await requirePermission("viewPlans", "/dashboard/planos");
  const viewer = await getViewerContextFromSession(session);
  const { id } = await params;
  const data = await getPlanDetailData(viewer, id);
  const { plan } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Plano"
        title={plan.name}
        description={`Plano ${plan.slug} com ${plan._count.subscriptions} assinatura(s) vinculada(s).`}
        action={
          <Button asChild variant="secondary">
            <Link href="/dashboard/planos">Voltar para planos</Link>
          </Button>
        }
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-5 xl:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={getPlanStatusTone(plan.active)}>
              {plan.active ? "Ativo" : "Inativo"}
            </StatusBadge>
            {plan.modality ? <StatusBadge tone="info">{plan.modality.name}</StatusBadge> : null}
            <StatusBadge tone="neutral">{getBillingIntervalLabel(plan.billingIntervalMonths)}</StatusBadge>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">Preco</p>
              <p className="mt-3 text-lg font-semibold text-white">
                {formatCurrencyFromCents(plan.priceCents)}
              </p>
              <p className="mt-1 text-xs text-brand-gray-light">
                Matricula {formatCurrencyFromCents(plan.enrollmentFeeCents)}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">Duracao</p>
              <p className="mt-3 text-lg font-semibold text-white">
                {formatMonthsLabel(plan.durationMonths ?? plan.billingIntervalMonths)}
              </p>
              <p className="mt-1 text-xs text-brand-gray-light">
                {plan.isUnlimited
                  ? "Acesso ilimitado"
                  : plan.sessionsPerWeek
                    ? `${plan.sessionsPerWeek} sessoes por semana`
                    : "Sem limite semanal definido"}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">Resumo</p>
              <p className="mt-3 text-lg font-semibold text-white">
                {plan._count.subscriptions} assinatura(s)
              </p>
              <p className="mt-1 text-xs text-brand-gray-light">
                {plan.modality?.name ?? "Plano geral da academia"}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">Descricao</p>
            <p className="mt-3 text-sm text-white">
              {plan.description ?? "Sem descricao complementar cadastrada."}
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">Beneficios</p>
            {plan.benefits.length === 0 ? (
              <p className="mt-3 text-sm text-brand-gray-light">
                Nenhum beneficio foi cadastrado para este plano.
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {plan.benefits.map((benefit) => (
                  <StatusBadge key={benefit} tone="info">
                    {benefit}
                  </StatusBadge>
                ))}
              </div>
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-5">
          <h2 className="text-lg font-bold text-white">Acoes rapidas</h2>
          <div className="mt-4 space-y-3">
            {data.canManage ? (
              <ApiActionButton
                endpoint={`/api/plans/${plan.id}`}
                method="DELETE"
                label="Arquivar plano"
                loadingLabel="Arquivando..."
                variant="danger"
                confirmMessage="Deseja realmente arquivar este plano?"
              />
            ) : null}
            <p className="text-sm text-brand-gray-light">
              Planos com assinaturas vigentes nao podem ser arquivados ate a regularizacao do vinculo.
            </p>
          </div>
        </article>
      </section>

      {data.canManage ? (
        <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
          <h2 className="text-xl font-bold text-white">Editar plano</h2>
          <p className="mt-1 text-sm text-brand-gray-light">
            Atualize os dados comerciais e a disponibilidade do plano.
          </p>
          <div className="mt-6">
            <PlanForm
              mode="edit"
              endpoint={`/api/plans/${plan.id}`}
              initialValues={{
                id: plan.id,
                name: plan.name,
                slug: plan.slug,
                description: plan.description ?? "",
                benefits: plan.benefits.join("\n"),
                modalityId: plan.modalityId ?? "",
                price: (plan.priceCents / 100).toFixed(2),
                billingIntervalMonths: String(plan.billingIntervalMonths),
                durationMonths: plan.durationMonths?.toString() ?? "",
                sessionsPerWeek: plan.sessionsPerWeek?.toString() ?? "",
                enrollmentFee: (plan.enrollmentFeeCents / 100).toFixed(2),
                isUnlimited: plan.isUnlimited,
                active: plan.active,
              }}
              options={data.options}
            />
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Assinaturas vinculadas</h2>
            <p className="mt-1 text-sm text-brand-gray-light">
              Contratos recentes associados a este plano.
            </p>
          </div>
          <StatusBadge tone="neutral">{plan.subscriptions.length} listada(s)</StatusBadge>
        </div>

        {plan.subscriptions.length === 0 ? (
          <p className="mt-6 text-sm text-brand-gray-light">
            Nenhuma assinatura vinculada a este plano no recorte atual.
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {plan.subscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {subscription.studentProfile.user.name}
                    </p>
                    <p className="mt-1 text-xs text-brand-gray-light">
                      Matricula {subscription.studentProfile.registrationNumber} • inicio{" "}
                      {formatDate(subscription.startDate)}
                    </p>
                  </div>
                  <StatusBadge tone={getSubscriptionStatusTone(subscription.status)}>
                    {getSubscriptionStatusLabel(subscription.status)}
                  </StatusBadge>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
