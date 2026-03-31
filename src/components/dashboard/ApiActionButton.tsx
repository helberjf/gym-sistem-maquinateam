"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

type ApiActionButtonProps = {
  endpoint: string;
  method?: "POST" | "PATCH" | "DELETE";
  payload?: Record<string, unknown>;
  confirmMessage?: string;
  label: string;
  loadingLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  redirectTo?: string;
  onSuccess?: () => void;
};

export function ApiActionButton({
  endpoint,
  method = "POST",
  payload,
  confirmMessage,
  label,
  loadingLabel,
  variant = "secondary",
  size = "sm",
  redirectTo,
  onSuccess,
}: ApiActionButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method,
        headers:
          method === "DELETE" && !payload
            ? undefined
            : {
                "Content-Type": "application/json",
              },
        body: payload ? JSON.stringify(payload) : undefined,
      });

      const data = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
          }
        | null;

      if (!response.ok || !data?.ok) {
        const nextError = data?.error ?? "Nao foi possivel concluir a acao.";
        setError(nextError);
        toast.error(nextError);
        setLoading(false);
        return;
      }

      toast.success("Acao concluida com sucesso.");

      if (redirectTo) {
        router.push(redirectTo);
      }

      router.refresh();
      onSuccess?.();
    } catch {
      const nextError = "Nao foi possivel concluir a acao.";
      setError(nextError);
      toast.error(nextError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={variant}
        size={size}
        loading={loading}
        onClick={handleClick}
      >
        {loading ? loadingLabel ?? "Processando..." : label}
      </Button>
      {error ? <p className="text-xs text-brand-white">{error}</p> : null}
    </div>
  );
}
