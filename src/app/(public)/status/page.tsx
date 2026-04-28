import { headers } from "next/headers";
import { Activity, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { SectionHeading } from "@/components/public/SectionHeading";
import { buildPublicMetadata } from "@/lib/seo";

export const metadata = buildPublicMetadata({
  title: "Status do sistema",
  description:
    "Acompanhe a disponibilidade dos servicos da Maquina Team em tempo real.",
  path: "/status",
});

export const revalidate = 30;

type HealthResponse = {
  status: string;
  project: string;
  version: string;
  timestamp: string;
  services: Record<string, "ok" | "error">;
};

async function fetchHealth(): Promise<HealthResponse | null> {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get("host");
    const protocol =
      requestHeaders.get("x-forwarded-proto") ??
      (host?.includes("localhost") ? "http" : "https");

    if (!host) {
      return null;
    }

    const response = await fetch(`${protocol}://${host}/api/health`, {
      cache: "no-store",
    });

    if (!response.ok && response.status !== 503) {
      return null;
    }

    const payload = (await response.json()) as
      | (HealthResponse & { ok?: boolean })
      | null;

    if (!payload || typeof payload.status !== "string") {
      return null;
    }

    return {
      status: payload.status,
      project: payload.project,
      version: payload.version,
      timestamp: payload.timestamp,
      services: payload.services,
    };
  } catch {
    return null;
  }
}

function getOverallTone(status?: string) {
  if (status === "ok") {
    return {
      icon: CheckCircle2,
      label: "Tudo operacional",
      colorClass: "text-emerald-400",
      borderClass: "border-emerald-500/30",
      bgClass: "bg-emerald-500/10",
    };
  }

  if (status === "degraded") {
    return {
      icon: AlertTriangle,
      label: "Servicos parcialmente degradados",
      colorClass: "text-amber-300",
      borderClass: "border-amber-500/30",
      bgClass: "bg-amber-500/10",
    };
  }

  return {
    icon: XCircle,
    label: "Falha ao consultar status",
    colorClass: "text-red-400",
    borderClass: "border-red-500/30",
    bgClass: "bg-red-500/10",
  };
}

function getServiceLabel(key: string) {
  switch (key) {
    case "db":
      return "Banco de dados";
    case "mail":
      return "Servico de email";
    default:
      return key;
  }
}

export default async function StatusPage() {
  const health = await fetchHealth();
  const tone = getOverallTone(health?.status);
  const ToneIcon = tone.icon;
  const services = health?.services ?? {};
  const checkedAt = health?.timestamp
    ? new Date(health.timestamp).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "medium",
      })
    : null;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Status"
        title="Disponibilidade dos servicos"
        description="Pagina atualizada a cada 30 segundos. Em caso de falha critica, acompanhe nossas atualizacoes pelo WhatsApp."
        align="center"
      />

      <div
        className={[
          "mt-10 flex items-center gap-4 rounded-3xl border px-5 py-5 sm:px-6",
          tone.borderClass,
          tone.bgClass,
        ].join(" ")}
      >
        <ToneIcon className={`h-8 w-8 shrink-0 ${tone.colorClass}`} />
        <div>
          <p
            className={`text-xs uppercase tracking-[0.24em] ${tone.colorClass}`}
          >
            Estado geral
          </p>
          <p className="mt-1 text-2xl font-bold text-white">{tone.label}</p>
          {checkedAt ? (
            <p className="mt-1 text-xs text-brand-gray-light">
              Verificado em {checkedAt}
            </p>
          ) : null}
        </div>
      </div>

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        {Object.entries(services).length === 0 ? (
          <div className="rounded-2xl border border-brand-gray-mid bg-brand-gray-dark p-5 text-sm text-brand-gray-light sm:col-span-2">
            Nao foi possivel consultar os servicos no momento.
          </div>
        ) : (
          Object.entries(services).map(([key, value]) => {
            const ok = value === "ok";

            return (
              <div
                key={key}
                className={[
                  "flex items-center justify-between rounded-2xl border px-5 py-4",
                  ok
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-red-500/20 bg-red-500/5",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <Activity
                    className={`h-5 w-5 ${
                      ok ? "text-emerald-400" : "text-red-400"
                    }`}
                  />
                  <span className="text-sm font-medium text-white">
                    {getServiceLabel(key)}
                  </span>
                </div>
                <span
                  className={[
                    "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                    ok
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-red-500/15 text-red-300",
                  ].join(" ")}
                >
                  {ok ? "Operacional" : "Indisponivel"}
                </span>
              </div>
            );
          })
        )}
      </section>

      {health ? (
        <p className="mt-8 text-center text-xs uppercase tracking-[0.24em] text-brand-gray-light">
          {health.project} v{health.version}
        </p>
      ) : null}
    </div>
  );
}
