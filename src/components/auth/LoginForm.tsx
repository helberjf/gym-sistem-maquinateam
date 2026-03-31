"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AUTH_ERROR_CODES, getAuthErrorMessage } from "@/lib/auth/error-codes";
import { sanitizeCallbackUrl } from "@/lib/auth/callback-url";
import { type LoginInput, loginSchema } from "@/lib/auth/validation";
import {
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/components/auth/styles";

type LoginFormProps = {
  googleEnabled: boolean;
};

function GoogleLogo() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] shrink-0"
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
    router.push(result?.url ?? callbackUrl);
    router.refresh();
  }

  function handleGoogleLogin() {
    setGoogleLoading(true);
    setError(null);
    setMessage(null);
    void signIn("google", { callbackUrl });
  }

  const email = watch("email");

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
            disabled={loading || googleLoading}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-brand-white">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm text-brand-gray-light">
              Senha
            </label>
            <Link
              href="/esqueci-senha"
              className="text-xs text-brand-red hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Sua senha"
            className={authInputClassName}
            disabled={loading || googleLoading}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-brand-white">{errors.password.message}</p>
          )}
        </div>

        {message && (
          <div className="rounded-xl border border-brand-white/15 bg-brand-white/5 px-4 py-3 text-sm text-brand-white">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-brand-gray-light/20 bg-brand-black/70 px-4 py-3 text-sm text-brand-white">
            {error}
          </div>
        )}

        {showResend && (
          <p className="text-xs text-brand-gray-light">
            Precisa de um novo link?{" "}
            <Link
              href={`/reenvio-confirmacao?email=${encodeURIComponent(email ?? "")}`}
              className="text-brand-red hover:underline"
            >
              Reenviar confirmacao
            </Link>
          </p>
        )}

        <button
          type="submit"
          disabled={loading || googleLoading}
          className={authPrimaryButtonClassName}
        >
          {loading ? "Entrando..." : "Entrar com e-mail"}
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
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition-all hover:bg-neutral-100 hover:shadow-sm disabled:opacity-60"
        >
          {googleLoading ? (
            <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
          ) : (
            <GoogleLogo />
          )}
          {googleLoading ? "Conectando..." : "Continuar com Google"}
        </button>
      ) : (
        <div className="rounded-xl border border-brand-gray-mid bg-brand-black/60 px-4 py-3 text-sm text-brand-gray-light">
          Login com Google disponivel assim que `GOOGLE_CLIENT_ID` e
          `GOOGLE_CLIENT_SECRET` forem configurados.
        </div>
      )}

      <p className="text-center text-sm text-brand-gray-light">
        Nao tem conta?{" "}
        <Link href="/cadastro" className="text-brand-red hover:underline">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
