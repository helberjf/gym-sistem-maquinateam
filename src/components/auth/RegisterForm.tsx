"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { sanitizeCallbackUrl } from "@/lib/auth/callback-url";
import { registerSchema, type RegisterInput } from "@/lib/auth/validation";
import {
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/styles";

function GoogleLogo() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5 shrink-0"
    >
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.27-2.09 3.57-5.18 3.57-8.64Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3c-1.07.72-2.44 1.15-4.06 1.15-3.12 0-5.76-2.11-6.7-4.95H1.3v3.09A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.29A7.18 7.18 0 0 1 4.93 12c0-.8.14-1.58.37-2.29V6.62H1.3A11.99 11.99 0 0 0 0 12c0 1.93.46 3.75 1.3 5.38l4-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.76c1.76 0 3.34.61 4.58 1.81l3.44-3.44C17.94 1.18 15.24 0 12 0A11.99 11.99 0 0 0 1.3 6.62l4 3.09c.94-2.84 3.58-4.95 6.7-4.95Z"
      />
    </svg>
  );
}

type RegisterFormProps = {
  googleEnabled: boolean;
};

export function RegisterForm({ googleEnabled }: RegisterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackUrl(
    searchParams.get("callbackUrl"),
    "/dashboard",
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

    if (callbackUrl !== "/dashboard") {
      params.set("callbackUrl", callbackUrl);
    }

    router.push(`/confirmar-email?${params.toString()}`);
    router.refresh();
  }

  function handleGoogleSignup() {
    setGoogleLoading(true);
    void signIn("google", { callbackUrl });
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
            disabled={loading || googleLoading}
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
            disabled={loading || googleLoading}
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
            disabled={loading || googleLoading}
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
            disabled={loading || googleLoading}
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
          disabled={loading || googleLoading}
          className={authPrimaryButtonClassName}
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-brand-gray-mid" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-[0.2em]">
          <span className="bg-brand-gray-dark px-3 text-brand-gray-light">
            ou continue com
          </span>
        </div>
      </div>

      {googleEnabled ? (
        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={loading || googleLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition-all hover:bg-neutral-100 hover:shadow-sm disabled:opacity-60"
        >
          {googleLoading ? (
            <span className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
          ) : (
            <GoogleLogo />
          )}
          {googleLoading ? "Conectando..." : "Cadastrar com Google"}
        </button>
      ) : (
        <div className="rounded-xl border border-brand-gray-mid bg-brand-black/60 px-4 py-3 text-sm text-brand-gray-light">
          Cadastro com Google disponivel assim que{" "}
          <code className="text-brand-white">GOOGLE_CLIENT_ID</code> e{" "}
          <code className="text-brand-white">GOOGLE_CLIENT_SECRET</code> forem configurados.
        </div>
      )}

      <p className="text-center text-sm text-brand-gray-light">
        Ja tem conta?{" "}
        <Link href="/login" className="text-brand-red hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
