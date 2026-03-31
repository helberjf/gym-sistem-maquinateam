"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { registerSchema, type RegisterInput } from "@/lib/auth/validation";
import {
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/styles";

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: RegisterInput) {
    setLoading(true);
    setServerError(null);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const payload = (await response.json().catch(() => null)) as
      | { ok?: boolean; error?: string; email?: string; emailSent?: boolean }
      | null;

    setLoading(false);

    if (!response.ok || !payload?.ok) {
      const nextError = payload?.error ?? "Nao foi possivel criar sua conta.";
      setServerError(nextError);
      toast.error(nextError);
      return;
    }

    toast.success(
      payload.emailSent
        ? "Conta criada. Verifique seu e-mail."
        : "Conta criada. Use o reenvio de confirmacao se precisar.",
    );

    const params = new URLSearchParams({
      email: payload.email ?? data.email,
      sent: payload.emailSent ? "1" : "0",
    });

    router.push(`/confirmar-email?${params.toString()}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm text-brand-gray-light">
            Nome completo
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Seu nome"
            className={authInputClassName}
            disabled={loading}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-brand-white">{errors.name.message}</p>
          )}
        </div>

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

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm text-brand-gray-light">
            Senha
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
          <label htmlFor="confirmPassword" className="text-sm text-brand-gray-light">
            Confirmar senha
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repita sua senha"
            className={authInputClassName}
            disabled={loading}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-brand-white">{errors.confirmPassword.message}</p>
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
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <p className="text-center text-sm text-brand-gray-light">
        Ja tem conta?{" "}
        <Link href="/login" className="text-brand-red hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
