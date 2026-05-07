"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Props = {
  id: string;
  isRead: boolean;
  isArchived: boolean;
};

async function callApi(path: string, method: "PATCH" | "DELETE", body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error ?? "Erro");
  }
}

export function NotificationActions({ id, isRead, isArchived }: Props) {
  const router = useRouter();
  const [isPending, start] = useTransition();

  function run(action: () => Promise<void>, success: string) {
    start(async () => {
      try {
        await action();
        toast.success(success);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erro ao atualizar.",
        );
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {!isArchived && !isRead ? (
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            run(
              () =>
                callApi(`/api/notifications/${id}`, "PATCH", { action: "read" }),
              "Marcada como lida.",
            )
          }
          className="rounded-full border border-brand-white/20 bg-brand-white/5 px-3 py-1 text-brand-white hover:bg-brand-white/10 disabled:opacity-60"
        >
          Marcar lida
        </button>
      ) : null}
      {!isArchived && isRead ? (
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            run(
              () =>
                callApi(`/api/notifications/${id}`, "PATCH", {
                  action: "unread",
                }),
              "Marcada como nao lida.",
            )
          }
          className="rounded-full border border-brand-white/20 bg-brand-white/5 px-3 py-1 text-brand-white hover:bg-brand-white/10 disabled:opacity-60"
        >
          Marcar nao lida
        </button>
      ) : null}
      {!isArchived ? (
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            run(
              () =>
                callApi(`/api/notifications/${id}`, "PATCH", {
                  action: "archive",
                }),
              "Arquivada.",
            )
          }
          className="rounded-full border border-brand-white/20 bg-brand-white/5 px-3 py-1 text-brand-white hover:bg-brand-white/10 disabled:opacity-60"
        >
          Arquivar
        </button>
      ) : null}
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          run(
            () => callApi(`/api/notifications/${id}`, "DELETE"),
            "Excluida.",
          )
        }
        className="rounded-full border border-brand-red/40 bg-brand-red/10 px-3 py-1 text-brand-red hover:bg-brand-red/20 disabled:opacity-60"
      >
        Excluir
      </button>
    </div>
  );
}

export function MarkAllReadButton() {
  const router = useRouter();
  const [isPending, start] = useTransition();

  function handleClick() {
    start(async () => {
      try {
        const res = await fetch("/api/notifications/mark-all-read", {
          method: "POST",
        });
        const data = (await res.json().catch(() => null)) as
          | { ok?: boolean; updated?: number; error?: string }
          | null;
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error ?? "Erro");
        }
        toast.success(`${data.updated ?? 0} notificacao(oes) marcada(s).`);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erro ao atualizar.",
        );
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded-xl border border-brand-white/20 bg-brand-white/5 px-4 py-2 text-sm font-semibold text-brand-white hover:bg-brand-white/10 disabled:opacity-60"
    >
      Marcar todas como lidas
    </button>
  );
}
