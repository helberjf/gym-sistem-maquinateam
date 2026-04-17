"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { refreshPublicViewer } from "@/components/public/usePublicViewer";
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

      void refreshPublicViewer();
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
      void refreshPublicViewer();
      router.refresh();
    } catch {
      toast.error("Nao foi possivel remover o item.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex items-center rounded-full border border-brand-gray-mid bg-brand-black/70 p-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 rounded-full border-0 px-0 py-0 text-white hover:bg-white/10"
          disabled={loading || quantity <= minQuantity}
          onClick={() => updateQuantity(quantity - 1)}
          aria-label="Diminuir quantidade"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="min-w-8 text-center text-sm font-semibold text-white">
          {quantity}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 rounded-full border-0 px-0 py-0 text-white hover:bg-white/10"
          disabled={loading || (maxQuantity !== null && quantity >= maxQuantity)}
          onClick={() => updateQuantity(quantity + 1)}
          aria-label="Aumentar quantidade"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="rounded-full border border-transparent px-0 py-0 text-xs uppercase tracking-[0.18em] text-brand-gray-light hover:bg-transparent hover:text-white"
        disabled={loading}
        onClick={removeItem}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Remover
      </Button>
    </div>
  );
}
