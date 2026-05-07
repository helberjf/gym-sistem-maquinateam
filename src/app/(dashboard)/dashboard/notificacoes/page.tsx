import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  MarkAllReadButton,
  NotificationActions,
} from "@/components/dashboard/NotificationActions";
import { PushSubscribeButton } from "@/components/pwa/PushSubscribeButton";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { listNotifications } from "@/lib/notifications/inbox";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Notificacoes",
  description: "Caixa de entrada de avisos do sistema.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const TONE_CLASS: Record<string, string> = {
  INFO: "border-brand-white/15 bg-brand-white/5 text-brand-white",
  SUCCESS: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  WARNING: "border-yellow-500/40 bg-yellow-500/10 text-yellow-200",
  DANGER: "border-brand-red/40 bg-brand-red/10 text-brand-red",
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireAuthenticatedSession("/dashboard/notificacoes");
  const params = await searchParams;
  const rawStatus = Array.isArray(params.status) ? params.status[0] : params.status;
  const status: "all" | "unread" | "archived" =
    rawStatus === "unread" || rawStatus === "archived" ? rawStatus : "all";

  const { items, pagination, unreadCount } = await listNotifications({
    userId: session.user.id,
    status,
    page: Number(Array.isArray(params.page) ? params.page[0] : params.page) || 1,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Avisos"
        title="Notificacoes"
        description="Sua caixa de entrada com avisos do sistema, lembretes financeiros e operacionais."
        action={
          <div className="flex flex-wrap gap-2">
            <PushSubscribeButton />
            <MarkAllReadButton />
          </div>
        }
      />

      <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-4">
        <nav className="flex flex-wrap gap-2 text-sm">
          {(
            [
              ["all", "Todas"],
              ["unread", `Nao lidas (${unreadCount})`],
              ["archived", "Arquivadas"],
            ] as const
          ).map(([value, label]) => {
            const active = status === value;
            return (
              <Link
                key={value}
                href={`/dashboard/notificacoes?status=${value}`}
                className={[
                  "rounded-full border px-4 py-2 transition",
                  active
                    ? "border-brand-red bg-brand-red/15 text-brand-red"
                    : "border-brand-gray-mid bg-brand-black/40 text-brand-gray-light hover:bg-brand-gray-mid",
                ].join(" ")}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </section>

      <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
        {items.length === 0 ? (
          <p className="text-sm text-brand-gray-light">
            Nenhuma notificacao para este filtro.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((notification) => {
              const isRead = notification.readAt !== null;
              const isArchived = notification.archivedAt !== null;
              const toneClass = TONE_CLASS[notification.tone] ?? TONE_CLASS.INFO;
              return (
                <li
                  key={notification.id}
                  className={[
                    "rounded-2xl border p-4",
                    isRead
                      ? "border-brand-gray-mid bg-brand-black/40"
                      : "border-brand-white/15 bg-brand-black/60",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${toneClass}`}
                        >
                          {notification.tone}
                        </span>
                        <h3
                          className={[
                            "text-sm font-semibold",
                            isRead ? "text-brand-gray-light" : "text-white",
                          ].join(" ")}
                        >
                          {notification.title}
                        </h3>
                        {!isRead ? (
                          <span className="size-2 rounded-full bg-brand-red" />
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-brand-gray-light">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-[11px] text-brand-gray-light/70">
                        {notification.createdAt
                          .toISOString()
                          .slice(0, 16)
                          .replace("T", " ")}
                      </p>
                      {notification.href ? (
                        <Link
                          href={notification.href}
                          className="mt-2 inline-block text-xs font-semibold text-brand-red hover:text-brand-red-dark"
                        >
                          Abrir destino
                        </Link>
                      ) : null}
                    </div>
                    <NotificationActions
                      id={notification.id}
                      isRead={isRead}
                      isArchived={isArchived}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {pagination.totalPages > 1 ? (
          <p className="mt-4 text-xs text-brand-gray-light">
            Pagina {pagination.page} de {pagination.totalPages} - {pagination.totalItems} item(s)
          </p>
        ) : null}
      </section>
    </div>
  );
}
