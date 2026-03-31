"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ApiMutationOptions<TPayload> = {
  endpoint: string;
  method: "POST" | "PATCH" | "DELETE";
  redirectTo?: string;
  successMessage?: string;
  onSuccess?: (payload: Record<string, unknown>) => void;
};

export function useApiMutation<TPayload>({
  endpoint,
  method,
  redirectTo,
  successMessage,
  onSuccess,
}: ApiMutationOptions<TPayload>) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function submit(payload: TPayload) {
    setIsPending(true);
    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch(endpoint, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: method === "DELETE" ? undefined : JSON.stringify(payload),
        });

        const data = (await response.json().catch(() => null)) as
          | {
              ok?: boolean;
              error?: string;
              message?: string;
            }
          | null;

        if (!response.ok || !data?.ok) {
          const nextError = data?.error ?? "Nao foi possivel concluir a operacao.";
          setError(nextError);
          toast.error(nextError);
          setIsPending(false);
          return;
        }

        const nextMessage = successMessage ?? data.message ?? "Operacao concluida.";
        setMessage(nextMessage);
        toast.success(nextMessage);
        onSuccess?.(data as Record<string, unknown>);

        if (redirectTo) {
          router.push(redirectTo);
        }

        router.refresh();
      } catch {
        const nextError = "Nao foi possivel concluir a operacao.";
        setError(nextError);
        toast.error(nextError);
      } finally {
        setIsPending(false);
      }
    });
  }

  return {
    submit,
    isPending,
    error,
    message,
    clearMessage() {
      setMessage(null);
      setError(null);
    },
  };
}
