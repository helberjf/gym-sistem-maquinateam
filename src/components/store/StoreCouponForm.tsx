"use client";

import { useApiMutation } from "@/components/dashboard/useApiMutation";
import {
  helperTextClassName,
  inputClassName,
  labelClassName,
  textareaClassName,
} from "@/components/dashboard/styles";
import { Button } from "@/components/ui/Button";

type StoreCouponFormProps = {
  mode: "create" | "edit";
  endpoint: string;
  categories: string[];
  initialValues: {
    id?: string;
    code: string;
    description: string;
    discountType: "PERCENTAGE" | "FIXED_AMOUNT";
    discountValue: string;
    active: boolean;
    usageLimit: string;
    perUserLimit: string;
    minOrderValue: string;
    startsAt: string;
    expiresAt: string;
    eligibleCategories: string[];
  };
};

export function StoreCouponForm({
  mode,
  endpoint,
  categories,
  initialValues,
}: StoreCouponFormProps) {
  const { submit, isPending, error, message } = useApiMutation<Record<string, unknown>>({
    endpoint,
    method: mode === "create" ? "POST" : "PATCH",
    successMessage:
      mode === "create"
        ? "Cupom criado com sucesso."
        : "Cupom atualizado com sucesso.",
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    submit({
      id: initialValues.id,
      code: String(formData.get("code") ?? ""),
      description: String(formData.get("description") ?? ""),
      discountType: String(formData.get("discountType") ?? "PERCENTAGE"),
      discountValue: String(formData.get("discountValue") ?? ""),
      active: Boolean(formData.get("active")),
      usageLimit: String(formData.get("usageLimit") ?? ""),
      perUserLimit: String(formData.get("perUserLimit") ?? ""),
      minOrderValueCents: String(formData.get("minOrderValueCents") ?? ""),
      startsAt: String(formData.get("startsAt") ?? ""),
      expiresAt: String(formData.get("expiresAt") ?? ""),
      eligibleCategories: formData.getAll("eligibleCategories").map((value) => String(value)),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5">
          <label htmlFor="code" className={labelClassName}>
            Codigo
          </label>
          <input id="code" name="code" defaultValue={initialValues.code} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="discountType" className={labelClassName}>
            Tipo de desconto
          </label>
          <select
            id="discountType"
            name="discountType"
            defaultValue={initialValues.discountType}
            className={inputClassName}
          >
            <option value="PERCENTAGE">Percentual</option>
            <option value="FIXED_AMOUNT">Valor fixo</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="discountValue" className={labelClassName}>
            Valor
          </label>
          <input
            id="discountValue"
            name="discountValue"
            type="number"
            min="0"
            step="0.01"
            defaultValue={initialValues.discountValue}
            className={inputClassName}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="minOrderValueCents" className={labelClassName}>
            Pedido minimo (R$)
          </label>
          <input
            id="minOrderValueCents"
            name="minOrderValueCents"
            type="number"
            min="0"
            step="0.01"
            defaultValue={initialValues.minOrderValue}
            className={inputClassName}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="usageLimit" className={labelClassName}>
            Limite total
          </label>
          <input
            id="usageLimit"
            name="usageLimit"
            type="number"
            min="0"
            step="1"
            defaultValue={initialValues.usageLimit}
            className={inputClassName}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="perUserLimit" className={labelClassName}>
            Limite por usuario
          </label>
          <input
            id="perUserLimit"
            name="perUserLimit"
            type="number"
            min="0"
            step="1"
            defaultValue={initialValues.perUserLimit}
            className={inputClassName}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="startsAt" className={labelClassName}>
            Inicio
          </label>
          <input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            defaultValue={initialValues.startsAt}
            className={inputClassName}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="expiresAt" className={labelClassName}>
            Expiracao
          </label>
          <input
            id="expiresAt"
            name="expiresAt"
            type="datetime-local"
            defaultValue={initialValues.expiresAt}
            className={inputClassName}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className={labelClassName}>
          Descricao
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={initialValues.description}
          className={textareaClassName}
        />
      </div>

      <div className="space-y-3">
        <div>
          <p className={labelClassName}>Categorias elegiveis</p>
          <p className={helperTextClassName}>
            Se nada for marcado, o cupom vale para todo o catalogo publico.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <label
              key={category}
              className="flex items-center gap-3 rounded-2xl border border-brand-gray-mid bg-brand-black/30 px-4 py-3 text-sm text-white"
            >
              <input
                type="checkbox"
                name="eligibleCategories"
                value={category}
                defaultChecked={initialValues.eligibleCategories.includes(category)}
                className="h-4 w-4 accent-brand-red"
              />
              {category}
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-brand-gray-mid bg-brand-black/30 px-4 py-3 text-sm text-white">
        <input
          type="checkbox"
          name="active"
          defaultChecked={initialValues.active}
          className="h-4 w-4 accent-brand-red"
        />
        Cupom ativo para novos pedidos.
      </label>

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
          {mode === "create" ? "Criar cupom" : "Salvar cupom"}
        </Button>
      </div>
    </form>
  );
}
