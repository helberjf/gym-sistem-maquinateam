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

function GoogleLogo() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
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

  const baseInputClassName =
    "w-full rounded-md border px-2 py-1 text-[12px] disabled:opacity-60";
  const inputClassName = `${baseInputClassName} border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100`;
  const labelClassName = "text-[10px] text-neutral-600 dark:text-neutral-400";
  const errorClassName = "text-[10px] text-red-600";

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
        <div className="space-y-px">
          <label htmlFor="name" className={labelClassName}>
            Nome completo
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Seu nome"
            className={inputClassName}
            disabled={loading || googleLoading}
            {...register("name")}
          />
          {errors.name && <p className={errorClassName}>{errors.name.message}</p>}
        </div>

        <div className="space-y-px">
          <label htmlFor="email" className={labelClassName}>
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            className={inputClassName}
            disabled={loading || googleLoading}
            {...register("email")}
          />
          {errors.email && <p className={errorClassName}>{errors.email.message}</p>}
        </div>

        <div className="space-y-px">
          <label htmlFor="password" className={labelClassName}>
            Senha
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Minimo de 8 caracteres"
            className={inputClassName}
            disabled={loading || googleLoading}
            {...register("password")}
          />
          {errors.password && (
            <p className={errorClassName}>{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-px">
          <label htmlFor="confirmPassword" className={labelClassName}>
            Confirmar senha
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repita sua senha"
            className={inputClassName}
            disabled={loading || googleLoading}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className={errorClassName}>{errors.confirmPassword.message}</p>
          )}
        </div>

        {serverError && <p className={errorClassName}>{serverError}</p>}

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full rounded-md bg-blue-600 py-1.5 text-sm text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-neutral-300 dark:border-neutral-700" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase">
          <span className="bg-white px-2 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
            ou continue com
          </span>
        </div>
      </div>

      {googleEnabled ? (
        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={loading || googleLoading}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-1.5 text-sm font-medium text-neutral-800 transition-all hover:bg-neutral-100 hover:shadow-sm disabled:opacity-60"
        >
          {googleLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
          ) : (
            <GoogleLogo />
          )}
          {googleLoading ? "Conectando..." : "Cadastrar com Google"}
        </button>
      ) : (
        <div className="rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
          Cadastro com Google disponivel assim que{" "}
          <code className="text-neutral-800 dark:text-neutral-100">GOOGLE_CLIENT_ID</code> e{" "}
          <code className="text-neutral-800 dark:text-neutral-100">GOOGLE_CLIENT_SECRET</code> forem configurados.
        </div>
      )}

      <p className="text-center text-[10px] text-neutral-500 dark:text-neutral-400">
        Ja tem conta?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
