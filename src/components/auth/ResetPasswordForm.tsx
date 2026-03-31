"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/styles";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/auth/validation";

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: ResetPasswordInput) {
    setLoading(true);
    setServerError(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        const nextError = payload?.error ?? "Nao foi possivel redefinir a senha.";
        setServerError(nextError);
        toast.error(nextError);
        return;
      }

      toast.success("Senha redefinida com sucesso.");
      router.push("/login?reset=1");
      router.refresh();
    } catch {
      const nextError = "Nao foi possivel redefinir a senha.";
      setServerError(nextError);
      toast.error(nextError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register("token")} />

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm text-brand-gray-light">
            Nova senha
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Minimo de 8 caracteres"
            className={authInputClassName}
            disabled={loading}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-brand-white">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="text-sm text-brand-gray-light"
          >
            Confirmar nova senha
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repita a nova senha"
            className={authInputClassName}
            disabled={loading}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-brand-white">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

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
          {loading ? "Salvando..." : "Redefinir senha"}
        </button>
      </form>

      <p className="text-center text-sm text-brand-gray-light">
        Lembrou a senha?{" "}
        <Link href="/login" className="text-brand-red hover:underline">
          Voltar para login
        </Link>
      </p>
    </div>
  );
}
