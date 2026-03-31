"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

type ApplyCouponFormProps = {
  initialCode?: string;
  onValidated?: (payload: {
    code: string;
    valid: boolean;
    discountCents?: number;
  }) => void;
};

export function ApplyCouponForm({
  initialCode = "",
  onValidated,
}: ApplyCouponFormProps) {
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [valid, setValid] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/store/coupon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            valid?: boolean;
            message?: string;
            discountCents?: number;
          }
        | null;

      if (!response.ok || !payload?.ok) {
        const nextError = payload?.error ?? "Nao foi possivel validar o cupom.";
        setValid(false);
        setMessage(nextError);
        toast.error(nextError);
        onValidated?.({
          code,
          valid: false,
        });
        return;
      }

      setValid(Boolean(payload.valid));
      setMessage(payload.message ?? (payload.valid ? "Cupom validado." : "Cupom indisponivel."));

      if (payload.valid) {
        toast.success(payload.message ?? "Cupom aplicado.");
      } else {
        toast.error(payload.message ?? "Cupom indisponivel.");
      }

      onValidated?.({
        code,
        valid: Boolean(payload.valid),
        discountCents: payload.discountCents,
      });
    } catch {
      const nextError = "Nao foi possivel validar o cupom.";
      setValid(false);
      setMessage(nextError);
      toast.error(nextError);
      onValidated?.({
        code,
        valid: false,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          className="w-full rounded-xl border border-brand-gray-mid bg-brand-black px-4 py-3 text-sm text-white outline-none transition focus:border-brand-red"
          placeholder="Cupom"
        />
        <Button type="submit" variant="secondary" loading={loading} className="sm:min-w-40">
          Aplicar cupom
        </Button>
      </div>

      {message ? (
        <p
          className={[
            "text-sm",
            valid ? "text-brand-white" : "text-brand-gray-light",
          ].join(" ")}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
