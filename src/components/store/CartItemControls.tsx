"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

type CartItemControlsProps = {
  itemId: string;
  quantity: number;
  minQuantity?: number;
  maxQuantity?: number | null;
};

export function CartItemControls({
  itemId,
  quantity,
  minQuantity = 1,
  maxQuantity = null,
}: CartItemControlsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateQuantity(nextQuantity: number) {
    setLoading(true);

    try {
      const response = await fetch(`/api/store/cart/items/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity: nextQuantity,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
          }
        | null;

      if (!response.ok || !payload?.ok) {
        toast.error(payload?.error ?? "Nao foi possivel atualizar a quantidade.");
        return;
      }

      router.refresh();
    } catch {
      toast.error("Nao foi possivel atualizar a quantidade.");
    } finally {
      setLoading(false);
    }
  }

  async function removeItem() {
    setLoading(true);

    try {
      const response = await fetch(`/api/store/cart/items/${itemId}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
          }
        | null;

      if (!response.ok || !payload?.ok) {
        toast.error(payload?.error ?? "Nao foi possivel remover o item.");
        return;
      }

      toast.success("Item removido do carrinho.");
      router.refresh();
    } catch {
      toast.error("Nao foi possivel remover o item.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={loading || quantity <= minQuantity}
        onClick={() => updateQuantity(quantity - 1)}
      >
        -
      </Button>
      <span className="min-w-10 text-center text-sm font-semibold text-white">
        {quantity}
      </span>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={loading || (maxQuantity !== null && quantity >= maxQuantity)}
        onClick={() => updateQuantity(quantity + 1)}
      >
        +
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={loading}
        onClick={removeItem}
      >
        Remover
      </Button>
    </div>
  );
}
