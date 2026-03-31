"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/styles";
import {
  resendVerificationSchema,
  type ResendVerificationInput,
} from "@/lib/auth/validation";

type ResendVerificationFormProps = {
  initialEmail?: string | null;
};

export function ResendVerificationForm({
  initialEmail,
}: ResendVerificationFormProps) {
  const searchParams = useSearchParams();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResendVerificationInput>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: {
      email: initialEmail ?? searchParams.get("email") ?? "",
    },
  });

  async function onSubmit(data: ResendVerificationInput) {
    setLoading(true);
    setServerMessage(null);
    setServerError(null);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        const nextError =
          payload?.error ?? "Nao foi possivel reenviar o e-mail agora.";
        setServerError(nextError);
        toast.error(nextError);
        return;
      }

      const nextMessage =
        payload?.message ??
        "Se existir uma conta pendente, enviaremos um novo e-mail de confirmacao.";
      setServerMessage(nextMessage);
      toast.success(nextMessage);
    } catch {
      const nextError = "Nao foi possivel reenviar o e-mail agora.";
      setServerError(nextError);
      toast.error(nextError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm text-brand-gray-light">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            className={authInputClassName}
            disabled={loading}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-brand-white">{errors.email.message}</p>
          )}
        </div>

        {serverMessage && (
          <div className="rounded-xl border border-brand-white/15 bg-brand-white/5 px-4 py-3 text-sm text-brand-white">
            {serverMessage}
          </div>
        )}

        {serverError && (
          <div className="rounded-xl border border-brand-gray-light/20 bg-brand-black/70 px-4 py-3 text-sm text-brand-white">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={authPrimaryButtonClassName}
        >
          {loading ? "Enviando..." : "Reenviar confirmacao"}
        </button>
      </form>

      <p className="text-center text-sm text-brand-gray-light">
        Ja confirmou?{" "}
        <Link href="/login" className="text-brand-red hover:underline">
          Voltar para login
        </Link>
      </p>
    </div>
  );
}
