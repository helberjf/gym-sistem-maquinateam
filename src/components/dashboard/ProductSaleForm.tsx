"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useApiMutation } from "@/components/dashboard/useApiMutation";
import {
  helperTextClassName,
  inputClassName,
  labelClassName,
  selectClassName,
  textareaClassName,
} from "@/components/dashboard/styles";
import {
  SALE_FORM_STATUS_OPTIONS,
  SALE_PAYMENT_METHOD_OPTIONS,
} from "@/lib/commerce/constants";
import { formatCurrencyFromCents } from "@/lib/billing/constants";

type ProductSaleItemValue = {
  productId: string;
  quantity: number;
};

type ProductSaleFormValues = {
  studentProfileId: string;
  customerName: string;
  customerDocument: string;
  paymentMethod: string;
  status: string;
  discount: string;
  soldAt: string;
  notes: string;
  items: ProductSaleItemValue[];
};

type ProductSaleFormProps = {
  endpoint: string;
  initialValues: ProductSaleFormValues;
  options: {
    students: Array<{
      id: string;
      name: string;
      registrationNumber: string;
    }>;
    products: Array<{
      id: string;
      name: string;
      category: string;
      priceCents: number;
      stockQuantity: number;
      trackInventory: boolean;
      imageUrl?: string | null;
    }>;
  };
};

export function ProductSaleForm({
  endpoint,
  initialValues,
  options,
}: ProductSaleFormProps) {
  const router = useRouter();
  const [items, setItems] = useState<ProductSaleItemValue[]>(
    initialValues.items.length > 0 ? initialValues.items : [{ productId: "", quantity: 1 }],
  );
  const [selectedStudentId, setSelectedStudentId] = useState(initialValues.studentProfileId);
  const { submit, isPending, error, message } = useApiMutation<Record<string, unknown>>({
    endpoint,
    method: "POST",
    successMessage: "Venda registrada com sucesso.",
    onSuccess(data) {
      if (typeof data.saleId === "string") {
        router.push(`/dashboard/vendas/${data.saleId}`);
      }
    },
  });

  const productMap = useMemo(
    () =>
      new Map(
        options.products.map((product) => [
          product.id,
          product,
        ]),
      ),
    [options.products],
  );

  const subtotalCents = items.reduce((total, item) => {
    const product = productMap.get(item.productId);

    if (!product) {
      return total;
    }

    return total + product.priceCents * item.quantity;
  }, 0);

  function handleItemChange(
    index: number,
    field: keyof ProductSaleItemValue,
    value: string,
  ) {
    setItems((current) =>
      current.map((item, currentIndex) =>
        currentIndex === index
          ? {
              ...item,
              [field]: field === "quantity" ? Number(value || 1) : value,
            }
          : item,
      ),
    );
  }

  function addItem() {
    setItems((current) => [...current, { productId: "", quantity: 1 }]);
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    submit({
      studentProfileId: selectedStudentId,
      customerName: String(formData.get("customerName") ?? ""),
      customerDocument: String(formData.get("customerDocument") ?? ""),
      paymentMethod: String(formData.get("paymentMethod") ?? "PIX"),
      status: String(formData.get("status") ?? "PAID"),
      discountCents: String(formData.get("discountCents") ?? "0"),
      soldAt: String(formData.get("soldAt") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="studentProfileId" className={labelClassName}>
            Aluno vinculado
          </label>
          <select
            id="studentProfileId"
            name="studentProfileId"
            value={selectedStudentId}
            onChange={(event) => setSelectedStudentId(event.target.value)}
            className={selectClassName}
          >
            <option value="">Venda de balcao / visitante</option>
            {options.students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} • {student.registrationNumber}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="customerName" className={labelClassName}>
            Cliente
          </label>
          <input
            id="customerName"
            name="customerName"
            defaultValue={initialValues.customerName}
            className={inputClassName}
            placeholder="Opcional se houver aluno vinculado"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="customerDocument" className={labelClassName}>
            Documento
          </label>
          <input
            id="customerDocument"
            name="customerDocument"
            defaultValue={initialValues.customerDocument}
            className={inputClassName}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="paymentMethod" className={labelClassName}>
            Metodo de pagamento
          </label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            defaultValue={initialValues.paymentMethod}
            className={selectClassName}
          >
            {SALE_PAYMENT_METHOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="status" className={labelClassName}>
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={initialValues.status}
            className={selectClassName}
          >
            {SALE_FORM_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className={helperTextClassName}>
            Vendas pagas baixam estoque automaticamente.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="discountCents" className={labelClassName}>
            Desconto (R$)
          </label>
          <input
            id="discountCents"
            name="discountCents"
            type="number"
            min="0"
            step="0.01"
            defaultValue={initialValues.discount}
            className={inputClassName}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="soldAt" className={labelClassName}>
            Data da venda
          </label>
          <input
            id="soldAt"
            name="soldAt"
            type="date"
            defaultValue={initialValues.soldAt}
            className={inputClassName}
          />
        </div>
      </div>

      <section className="space-y-4 rounded-3xl border border-brand-gray-mid bg-brand-black/20 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Itens da venda</h2>
            <p className={helperTextClassName}>
              Escolha os produtos e quantidades. O preco unitario segue o cadastro atual.
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={addItem}>
            Adicionar item
          </Button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => {
            const selectedProduct = productMap.get(item.productId);

            return (
              <div
                key={`${item.productId}-${index}`}
                className="grid grid-cols-1 gap-4 rounded-2xl border border-brand-gray-mid bg-brand-gray-dark p-4 lg:grid-cols-[minmax(0,1fr)_120px_auto]"
              >
                <div className="space-y-1.5">
                  <label className={labelClassName}>Produto</label>
                  <select
                    value={item.productId}
                    onChange={(event) => handleItemChange(index, "productId", event.target.value)}
                    className={selectClassName}
                  >
                    <option value="">Selecione um produto</option>
                    {options.products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} • {product.category} • {formatCurrencyFromCents(product.priceCents)}
                      </option>
                    ))}
                  </select>
                  {selectedProduct ? (
                    <p className={helperTextClassName}>
                      Estoque: {selectedProduct.trackInventory ? selectedProduct.stockQuantity : "nao controlado"} •
                      {" "}Preco: {formatCurrencyFromCents(selectedProduct.priceCents)}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <label className={labelClassName}>Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(event) => handleItemChange(index, "quantity", event.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div className="flex items-end justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                  >
                    Remover
                  </Button>
                </div>

                {selectedProduct ? (
                  <div className="lg:col-span-3 rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
                    <p className="text-sm font-semibold text-white">
                      {selectedProduct.name}
                    </p>
                    <p className="mt-1 text-xs text-brand-gray-light">
                      {selectedProduct.category} • subtotal do item{" "}
                      {formatCurrencyFromCents(selectedProduct.priceCents * item.quantity)}
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <div className="space-y-1.5">
        <label htmlFor="notes" className={labelClassName}>
          Observacoes
        </label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={initialValues.notes}
          className={textareaClassName}
        />
      </div>

      <div className="rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
          Resumo parcial
        </p>
        <p className="mt-3 text-2xl font-bold text-white">
          {formatCurrencyFromCents(subtotalCents)}
        </p>
        <p className="mt-1 text-sm text-brand-gray-light">
          Valor antes do desconto. O total final sera calculado no servidor.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-brand-gray-light/20 bg-brand-black/70 px-4 py-3 text-sm text-brand-white">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-2xl border border-brand-white/15 bg-brand-white/5 px-4 py-3 text-sm text-brand-white">
          {message}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" size="lg" loading={isPending}>
          Registrar venda
        </Button>
      </div>
    </form>
  );
}
