import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { ApiActionButton } from "@/components/dashboard/ApiActionButton";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PaymentForm } from "@/components/dashboard/PaymentForm";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { formatDate, toDateInputValue } from "@/lib/academy/constants";
import { getViewerContextFromSession } from "@/lib/academy/access";
import {
  formatCurrencyFromCents,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from "@/lib/billing/constants";
import { resolvePaymentTone } from "@/lib/billing/presentation";
import { getPaymentDetailData } from "@/lib/billing/service";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Detalhes do pagamento",
  description: "Cobranca, status, assinatura vinculada e historico relacionado.",
};

type RouteParams = Promise<{ id: string }>;

export default async function PaymentDetailPage({
  params,
}: {
  params: RouteParams;
}) {
  const session = await requirePermission("viewPayments", "/dashboard/pagamentos");
  const viewer = await getViewerContextFromSession(session);
  const { id } = await params;
  const data = await getPaymentDetailData(viewer, id);
  const { payment } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pagamento"
        title={payment.studentProfile.user.name}
        description={`Cobranca vinculada ao plano ${payment.subscription.plan.name}.`}
        action={
          <Button asChild variant="secondary">
            <Link href="/dashboard/pagamentos">Voltar para pagamentos</Link>
          </Button>
        }
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-5 xl:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              tone={resolvePaymentTone({
                status: payment.status,
                dueDate: payment.dueDate,
              })}
            >
              {getPaymentStatusLabel(payment.status, payment.dueDate)}
            </StatusBadge>
            <StatusBadge tone="info">{getPaymentMethodLabel(payment.method)}</StatusBadge>
            <StatusBadge tone="neutral">{payment.subscription.plan.name}</StatusBadge>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">Valor</p>
              <p className="mt-3 text-lg font-semibold text-white">
                {formatCurrencyFromCents(payment.amountCents)}
              </p>
              <p className="mt-1 text-xs text-brand-gray-light">
                Vencimento {formatDate(payment.dueDate)}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">Pagamento</p>
              <p className="mt-3 text-lg font-semibold text-white">
                {payment.paidAt ? formatDate(payment.paidAt) : "Pendente"}
              </p>
              <p className="mt-1 text-xs text-brand-gray-light">
                Processado por {payment.processedByUser?.name ?? "ainda nao processado"}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">Aluno</p>
              <p className="mt-3 text-sm font-semibold text-white">
                {payment.studentProfile.user.name}
              </p>
              <p className="mt-1 text-xs text-brand-gray-light">
                {payment.studentProfile.registrationNumber}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">Descricao</p>
            <p className="mt-3 text-sm text-white">
              {payment.description ?? "Sem descricao complementar cadastrada."}
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">Observacoes</p>
            <p className="mt-3 text-sm text-white">
              {payment.notes ?? "Sem observacoes registradas."}
            </p>
          </div>
        </article>

        <article className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-5">
          <h2 className="text-lg font-bold text-white">Acoes rapidas</h2>
          <div className="mt-4 space-y-3">
            {data.canManage &&
            payment.status !== "PAID" &&
            payment.status !== "CANCELLED" ? (
              <ApiActionButton
                endpoint={`/api/payments/${payment.id}`}
                method="DELETE"
                label="Cancelar cobranca"
                loadingLabel="Cancelando..."
                variant="danger"
                confirmMessage="Deseja realmente cancelar esta cobranca?"
              />
            ) : null}
            <p className="text-sm text-brand-gray-light">
              Cancelamentos preservam o historico, mas tiram a cobranca do fluxo ativo da assinatura.
            </p>
          </div>
        </article>
      </section>

      {data.canManage && data.options ? (
        <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
          <h2 className="text-xl font-bold text-white">Editar pagamento</h2>
          <p className="mt-1 text-sm text-brand-gray-light">
            Ajuste vencimento, status, metodo e observacoes da mensalidade.
          </p>
          <div className="mt-6">
            <PaymentForm
              mode="edit"
              endpoint={`/api/payments/${payment.id}`}
              initialValues={{
                id: payment.id,
                studentProfileId: payment.studentProfile.id,
                subscriptionId: payment.subscription.id,
                amount: (payment.amountCents / 100).toFixed(2),
                status: payment.status,
                method: payment.method,
                dueDate: toDateInputValue(payment.dueDate),
                paidAt: toDateInputValue(payment.paidAt),
                description: payment.description ?? "",
                notes: payment.notes ?? "",
              }}
              options={{
                students: data.options.students.map((student) => ({
                  id: student.id,
                  name: student.user.name,
                  registrationNumber: student.registrationNumber,
                })),
                subscriptions: data.options.subscriptions.map((subscription) => ({
                  id: subscription.id,
                  studentProfileId: subscription.studentProfileId,
                  studentName: subscription.studentProfile.user.name,
                  registrationNumber: subscription.studentProfile.registrationNumber,
                  planName: subscription.plan.name,
                  status: subscription.status,
                })),
              }}
            />
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Outras cobrancas da assinatura</h2>
            <p className="mt-1 text-sm text-brand-gray-light">
              Historico financeiro relacionado ao mesmo contrato.
            </p>
          </div>
          <StatusBadge tone="neutral">{data.relatedPayments.length} relacionada(s)</StatusBadge>
        </div>

        {data.relatedPayments.length === 0 ? (
          <p className="mt-6 text-sm text-brand-gray-light">
            Esta e a unica cobranca registrada nesta assinatura.
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {data.relatedPayments.map((relatedPayment) => (
              <div
                key={relatedPayment.id}
                className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {relatedPayment.description ?? "Mensalidade manual"}
                    </p>
                    <p className="mt-1 text-xs text-brand-gray-light">
                      Vence em {formatDate(relatedPayment.dueDate)} • {getPaymentMethodLabel(relatedPayment.method)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      tone={resolvePaymentTone({
                        status: relatedPayment.status,
                        dueDate: relatedPayment.dueDate,
                      })}
                    >
                      {getPaymentStatusLabel(relatedPayment.status, relatedPayment.dueDate)}
                    </StatusBadge>
                    <StatusBadge tone="info">
                      {formatCurrencyFromCents(relatedPayment.amountCents)}
                    </StatusBadge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
