"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

type StoreFavoriteButtonProps = {
  productId: string;
  productName: string;
  initialIsFavorite?: boolean;
  disabled?: boolean;
  variant?: "overlay" | "inline";
  className?: string;
};

export function StoreFavoriteButton({
  productId,
  productName,
  initialIsFavorite = false,
  disabled = false,
  variant = "overlay",
  className = "",
}: StoreFavoriteButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite]);

  async function handleToggleFavorite(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (disabled || loading) {
      return;
    }

    setLoading(true);

    try {
      const nextMethod = isFavorite ? "DELETE" : "POST";
      const response = await fetch("/api/store/wishlist", {
        method: nextMethod,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            message?: string;
          }
        | null;

      if (response.status === 401) {
        toast.error("Entre na sua conta para salvar favoritos.");
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname || "/favoritos")}`);
        return;
      }

      if (!response.ok || !payload?.ok) {
        toast.error(payload?.error ?? "Nao foi possivel atualizar seus favoritos.");
        return;
      }

      const nextState = !isFavorite;
      setIsFavorite(nextState);
      toast.success(
        payload?.message ??
          (nextState
            ? `${productName} foi salvo nos favoritos.`
            : `${productName} saiu dos favoritos.`),
      );
      router.refresh();
    } catch {
      toast.error("Nao foi possivel atualizar seus favoritos.");
    } finally {
      setLoading(false);
    }
  }

  const baseClassName =
    variant === "overlay"
      ? [
          "absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition",
          isFavorite
            ? "border-black bg-black text-white"
            : "border-neutral-200 bg-white/95 text-neutral-700 hover:border-black hover:text-black",
          disabled ? "cursor-not-allowed opacity-50" : "",
          className,
        ].join(" ")
      : [
          "inline-flex h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium transition",
          isFavorite
            ? "border-black bg-black text-white"
            : "border-neutral-300 bg-white text-neutral-800 hover:border-black hover:text-black",
          disabled ? "cursor-not-allowed opacity-50" : "",
          className,
        ].join(" ");

  return (
    <button
      type="button"
      onClick={handleToggleFavorite}
      disabled={disabled || loading}
      className={baseClassName}
      aria-label={isFavorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
      title={isFavorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
    >
      <Heart className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} />
      {variant === "inline" ? <span>{isFavorite ? "Favoritado" : "Favoritar"}</span> : null}
    </button>
  );
}
