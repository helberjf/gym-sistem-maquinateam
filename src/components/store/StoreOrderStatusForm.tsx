"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

const STATUS_OPTIONS = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
] as const;

const PAYMENT_STATUS_OPTIONS = [
  PaymentStatus.PENDING,
  PaymentStatus.PAID,
  PaymentStatus.FAILED,
  PaymentStatus.CANCELLED,
  PaymentStatus.REFUNDED,
] as const;

type StoreOrderStatusFormProps = {
  orderId: string;
  currentStatus: OrderStatus;
  currentPaymentStatus: PaymentStatus;
  trackingCode?: string | null;
};

export function StoreOrderStatusForm({
  orderId,
  currentStatus,
  currentPaymentStatus,
  trackingCode,
}: StoreOrderStatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(currentPaymentStatus);
  const [tracking, setTracking] = useState(trackingCode ?? "");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/store/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          paymentStatus,
          trackingCode: tracking,
          note,
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
        toast.error(payload?.error ?? "Nao foi possivel atualizar o pedido.");
        return;
      }

      toast.success(payload.message ?? "Pedido atualizado.");
      setNote("");
      router.refresh();
    } catch {
      toast.error("Nao foi possivel atualizar o pedido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as OrderStatus)}
          className="w-full rounded-xl border border-brand-gray-mid bg-brand-black px-4 py-3 text-sm text-white outline-none transition focus:border-brand-red"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          value={paymentStatus}
          onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus)}
          className="w-full rounded-xl border border-brand-gray-mid bg-brand-black px-4 py-3 text-sm text-white outline-none transition focus:border-brand-red"
        >
          {PAYMENT_STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <input
        value={tracking}
        onChange={(event) => setTracking(event.target.value)}
        placeholder="Codigo de rastreio"
        className="w-full rounded-xl border border-brand-gray-mid bg-brand-black px-4 py-3 text-sm text-white outline-none transition focus:border-brand-red"
      />

      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Observacao da atualizacao"
        className="min-h-24 w-full rounded-xl border border-brand-gray-mid bg-brand-black px-4 py-3 text-sm text-white outline-none transition focus:border-brand-red"
      />

      <div className="flex justify-end">
        <Button type="submit" size="lg" loading={loading}>
          Atualizar pedido
        </Button>
      </div>
    </form>
  );
}
