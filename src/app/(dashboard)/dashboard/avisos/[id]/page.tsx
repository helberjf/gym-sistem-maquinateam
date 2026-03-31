import Link from "next/link";
import type { Metadata } from "next";
import { UserRole } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { ApiActionButton } from "@/components/dashboard/ApiActionButton";
import { AnnouncementForm } from "@/components/dashboard/AnnouncementForm";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { formatDate, toDateInputValue } from "@/lib/academy/constants";
import { getViewerContextFromSession } from "@/lib/academy/access";
import { requirePermission } from "@/lib/auth/guards";
import { getAnnouncementTargetLabel } from "@/lib/training/constants";
import { getAnnouncementTone } from "@/lib/training/presentation";
import { getAnnouncementDetailData } from "@/lib/training/service";

export const metadata: Metadata = {
  title: "Detalhes do aviso",
  description: "Leia o aviso completo e, se permitido, ajuste o comunicado.",
};

type RouteParams = Promise<{ id: string }>;

export default async function AnnouncementDetailPage({
  params,
}: {
  params: RouteParams;
}) {
  const session = await requirePermission("viewAnnouncements", "/dashboard/avisos");
  const viewer = await getViewerContextFromSession(session);
  const { id } = await params;
  const data = await getAnnouncementDetailData(viewer, id);
  const { announcement } = data;
  const expired = Boolean(
    announcement.expiresAt && announcement.expiresAt.getTime() <= Date.now(),
  );
  const canEdit =
    viewer.role === UserRole.ADMIN ||
    viewer.role === UserRole.RECEPCAO ||
    announcement.createdByUserId === viewer.userId;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Comunicacao"
        title={announcement.title}
        description={`Publicado por ${announcement.createdByUser.name} em ${formatDate(announcement.publishedAt ?? announcement.createdAt)}.`}
        action={
          <Button asChild variant="secondary">
            <Link href="/dashboard/avisos">Voltar para avisos</Link>
          </Button>
        }
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-5 xl:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              tone={getAnnouncementTone({
                isPinned: announcement.isPinned,
                isPublished: announcement.isPublished,
                expired,
              })}
            >
              {announcement.isPublished ? (expired ? "Expirado" : "Publicado") : "Rascunho"}
            </StatusBadge>
            {announcement.isPinned ? <StatusBadge tone="warning">Fixado</StatusBadge> : null}
            <StatusBadge tone="info">
              {getAnnouncementTargetLabel(announcement.targetRole)}
            </StatusBadge>
          </div>

          <div className="mt-5 rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
              Resumo
            </p>
            <p className="mt-3 text-sm text-white">
              {announcement.excerpt ?? "Sem resumo curto cadastrado."}
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
              Conteudo
            </p>
            <p className="mt-3 whitespace-pre-line text-sm text-white">
              {announcement.content}
            </p>
          </div>
        </article>

        <article className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-5">
          <h2 className="text-lg font-bold text-white">Resumo rapido</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                Publico
              </p>
              <p className="mt-3 text-sm font-semibold text-white">
                {getAnnouncementTargetLabel(announcement.targetRole)}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                Publicacao
              </p>
              <p className="mt-3 text-sm font-semibold text-white">
                {formatDate(announcement.publishedAt)}
              </p>
            </div>
            <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
                Expiracao
              </p>
              <p className="mt-3 text-sm font-semibold text-white">
                {formatDate(announcement.expiresAt)}
              </p>
            </div>
            {canEdit && announcement.isPublished ? (
              <ApiActionButton
                endpoint={`/api/announcements/${announcement.id}`}
                method="DELETE"
                label="Despublicar aviso"
                loadingLabel="Despublicando..."
                variant="danger"
                confirmMessage="Deseja realmente remover este aviso do painel?"
              />
            ) : null}
          </div>
        </article>
      </section>

      {canEdit ? (
        <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
          <h2 className="text-xl font-bold text-white">Editar aviso</h2>
          <p className="mt-1 text-sm text-brand-gray-light">
            Atualize o publico, o texto e o periodo de exibicao do comunicado.
          </p>
          <div className="mt-6">
            <AnnouncementForm
              mode="edit"
              endpoint={`/api/announcements/${announcement.id}`}
              viewerRole={viewer.role}
              initialValues={{
                id: announcement.id,
                title: announcement.title,
                slug: announcement.slug,
                excerpt: announcement.excerpt ?? "",
                content: announcement.content,
                targetRole: announcement.targetRole ?? "",
                isPinned: announcement.isPinned,
                isPublished: announcement.isPublished,
                publishedAt: toDateInputValue(announcement.publishedAt),
                expiresAt: toDateInputValue(announcement.expiresAt),
              }}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
