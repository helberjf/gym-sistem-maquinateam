"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

type AddToCartButtonProps = {
  productId: string;
  className?: string;
  label?: string;
  redirectToCart?: boolean;
  disabled?: boolean;
};

export function AddToCartButton({
  productId,
  className,
  label = "Adicionar ao carrinho",
  redirectToCart = false,
  disabled = false,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAddToCart() {
    setLoading(true);

    try {
      const response = await fetch("/api/store/cart/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            message?: string;
          }
        | null;

      if (!response.ok || !payload?.ok) {
        toast.error(payload?.error ?? "Nao foi possivel adicionar o item.");
        return;
      }

      toast.success(payload.message ?? "Produto adicionado ao carrinho.");

      if (redirectToCart) {
        router.push("/carrinho");
      } else {
        router.refresh();
      }
    } catch {
      toast.error("Nao foi possivel adicionar o item.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      size="lg"
      loading={loading}
      disabled={disabled}
      className={className}
      onClick={handleAddToCart}
    >
      {label}
    </Button>
  );
}
