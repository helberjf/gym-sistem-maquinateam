"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AUTH_ERROR_CODES, getAuthErrorMessage } from "@/lib/auth/error-codes";
import {
  sanitizeCallbackUrl,
  sanitizeClientRedirectUrl,
} from "@/lib/auth/callback-url";
import { type LoginInput, loginSchema } from "@/lib/auth/validation";

type LoginFormProps = {
  googleEnabled: boolean;
};

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

export function LoginForm({ googleEnabled }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackUrl(searchParams.get("callbackUrl"), "/dashboard");

  useEffect(() => {
    if (!searchParams.get("password")) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("password");

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `/login?${nextQuery}` : "/login");
  }, [router, searchParams]);

  const initialMessage = useMemo(() => {
    if (searchParams.get("verified") === "1") {
      return "E-mail confirmado com sucesso. Agora voce ja pode entrar.";
    }

    if (searchParams.get("reset") === "1") {
      return "Senha redefinida com sucesso. Entre com sua nova senha.";
    }

    if (searchParams.get("registered") === "1") {
      return "Conta criada. Confirme seu e-mail para fazer login.";
    }

    return null;
  }, [searchParams]);

  const routeError = getAuthErrorMessage(searchParams.get("error"));
  const [message, setMessage] = useState<string | null>(initialMessage);
  const [error, setError] = useState<string | null>(routeError);
  const [showResend, setShowResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: searchParams.get("email") ?? "",
      password: "",
    },
  });

  async function onSubmit(data: LoginInput) {
    setLoading(true);
    setError(null);
    setMessage(null);
    setShowResend(false);

    const result = (await signIn("credentials", {
      redirect: false,
      email: data.email,
      password: data.password,
      callbackUrl,
    })) as { error?: string | null; code?: string | null; url?: string | null } | undefined;

    setLoading(false);

    const errorCode = result?.code ?? result?.error;

    if (errorCode) {
      const nextError = getAuthErrorMessage(errorCode) ?? "Nao foi possivel entrar.";
      setError(nextError);
      toast.error(nextError);
      setShowResend(errorCode === AUTH_ERROR_CODES.emailNotVerified);
      return;
    }

    toast.success("Login realizado com sucesso.");
    router.push(sanitizeClientRedirectUrl(result?.url, callbackUrl));
    router.refresh();
  }

  function handleGoogleLogin() {
    setGoogleLoading(true);
    setError(null);
    setMessage(null);
    void signIn("google", { callbackUrl });
  }

  const email = watch("email");
  const inputClassName =
    "w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100";
  const labelClassName = "text-xs font-medium text-neutral-700 dark:text-neutral-300";

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-0.5">
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
          {errors.email && (
            <p className="text-[11px] text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-0.5">
          <label htmlFor="password" className={labelClassName}>
            Senha
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Sua senha"
            className={inputClassName}
            disabled={loading || googleLoading}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-[11px] text-red-500">{errors.password.message}</p>
          )}
        </div>

        {message && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {showResend && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Precisa de um novo link?{" "}
            <Link
              href={`/reenvio-confirmacao?email=${encodeURIComponent(email ?? "")}`}
              className="text-blue-600 hover:underline"
            >
              Reenviar confirmacao
            </Link>
          </p>
        )}

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full rounded-md bg-blue-600 py-1.5 text-sm text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
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
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-1.5 text-sm font-medium text-neutral-800 transition-all hover:bg-neutral-100 hover:shadow-sm disabled:opacity-60"
        >
          {googleLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
          ) : (
            <GoogleLogo />
          )}
          {googleLoading ? "Conectando..." : "Continuar com Google"}
        </button>
      ) : (
        <div className="rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
          Login com Google disponivel assim que `GOOGLE_CLIENT_ID` e
          `GOOGLE_CLIENT_SECRET` forem configurados.
        </div>
      )}

      <nav className="space-y-1 text-center text-xs" aria-label="Links auxiliares de autenticacao">
        <p>
          <Link href="/esqueci-senha" className="text-blue-600 hover:underline">
            Esqueceu sua senha?
          </Link>
        </p>

        <p className="text-neutral-500 dark:text-neutral-400">
          Nao tem conta?{" "}
          <Link href="/cadastro" className="text-blue-600 hover:underline">
            Criar conta
          </Link>
        </p>
      </nav>
    </div>
  );
}
