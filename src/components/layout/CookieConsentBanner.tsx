"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "maquinateam:cookie-consent";
const CONSENT_VERSION = "1";

type ConsentStatus = "pending" | "accepted" | "rejected";

function readStoredStatus(): ConsentStatus {
  if (typeof window === "undefined") {
    return "pending";
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return "pending";
    }

    const parsed = JSON.parse(raw) as {
      version?: string;
      status?: ConsentStatus;
    };

    if (parsed.version !== CONSENT_VERSION) {
      return "pending";
    }

    return parsed.status === "accepted" || parsed.status === "rejected"
      ? parsed.status
      : "pending";
  } catch {
    return "pending";
  }
}

function persistStatus(status: Exclude<ConsentStatus, "pending">) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: CONSENT_VERSION,
        status,
        decidedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // ignora ambientes sem storage
  }
}

export function CookieConsentBanner() {
  const [status, setStatus] = useState<ConsentStatus>("pending");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStatus(readStoredStatus());
    setHydrated(true);
  }, []);

  if (!hydrated || status !== "pending") {
    return null;
  }

  function handleAccept() {
    persistStatus("accepted");
    setStatus("accepted");
  }

  function handleReject() {
    persistStatus("rejected");
    setStatus("rejected");
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-3xl rounded-2xl border border-white/15 bg-brand-black/95 px-4 py-4 text-sm text-brand-gray-light shadow-[0_24px_70px_rgba(0,0,0,0.5)] backdrop-blur sm:inset-x-6 sm:bottom-6 sm:px-5 sm:py-5"
    >
      <p className="leading-6">
        Usamos cookies essenciais para autenticacao e seguranca, alem de
        metricas anonimas para entender o uso do site. Ao continuar, voce
        concorda com a nossa{" "}
        <Link
          href="/politica-de-privacidade"
          className="font-semibold text-white underline-offset-4 hover:underline"
        >
          Politica de Privacidade
        </Link>
        .
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={handleReject}
          className="inline-flex items-center justify-center rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-gray-light transition-colors hover:border-white/30 hover:text-white"
        >
          So o essencial
        </button>
        <button
          type="button"
          onClick={handleAccept}
          className="inline-flex items-center justify-center rounded-lg bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition-colors hover:bg-brand-red-dark"
        >
          Aceitar tudo
        </button>
      </div>
    </div>
  );
}
