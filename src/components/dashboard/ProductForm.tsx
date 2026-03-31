"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ProductImageUploader, type ProductImageValue } from "@/components/dashboard/ProductImageUploader";
import { useApiMutation } from "@/components/dashboard/useApiMutation";
import {
  helperTextClassName,
  inputClassName,
  labelClassName,
  textareaClassName,
} from "@/components/dashboard/styles";

type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  description: string;
  price: string;
  stockQuantity: string;
  lowStockThreshold: string;
  trackInventory: boolean;
  active: boolean;
  images: ProductImageValue[];
};

type ProductFormProps = {
  mode: "create" | "edit";
  endpoint: string;
  initialValues: ProductFormValues;
  options: {
    categories: string[];
  };
};

export function ProductForm({
  mode,
  endpoint,
  initialValues,
  options,
}: ProductFormProps) {
  const router = useRouter();
  const [images, setImages] = useState<ProductImageValue[]>(initialValues.images);
  const { submit, isPending, error, message } = useApiMutation<Record<string, unknown>>({
    endpoint,
    method: mode === "create" ? "POST" : "PATCH",
    successMessage:
      mode === "create"
        ? "Produto criado com sucesso."
        : "Produto atualizado com sucesso.",
    onSuccess(data) {
      if (mode === "create" && typeof data.productId === "string") {
        router.push(`/dashboard/produtos/${data.productId}`);
      }
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    submit({
      id: initialValues.id,
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      sku: String(formData.get("sku") ?? ""),
      category: String(formData.get("category") ?? ""),
      description: String(formData.get("description") ?? ""),
      priceCents: String(formData.get("priceCents") ?? ""),
      stockQuantity: String(formData.get("stockQuantity") ?? "0"),
      lowStockThreshold: String(formData.get("lowStockThreshold") ?? "3"),
      trackInventory: Boolean(formData.get("trackInventory")),
      active: Boolean(formData.get("active")),
      images: images.map((image, index) => ({
        ...image,
        sortOrder: index,
        isPrimary: image.isPrimary,
      })),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="name" className={labelClassName}>
            Nome
          </label>
          <input id="name" name="name" defaultValue={initialValues.name} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="sku" className={labelClassName}>
            SKU
          </label>
          <input id="sku" name="sku" defaultValue={initialValues.sku} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="slug" className={labelClassName}>
            Slug
          </label>
          <input id="slug" name="slug" defaultValue={initialValues.slug} className={inputClassName} />
          <p className={helperTextClassName}>
            Se ficar em branco, o sistema gera automaticamente a partir do nome.
          </p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="category" className={labelClassName}>
            Categoria
          </label>
          <input
            id="category"
            name="category"
            defaultValue={initialValues.category}
            className={inputClassName}
            list="product-category-suggestions"
          />
          <datalist id="product-category-suggestions">
            {options.categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="priceCents" className={labelClassName}>
            Preco (R$)
          </label>
          <input
            id="priceCents"
            name="priceCents"
            type="number"
            min="0"
            step="0.01"
            defaultValue={initialValues.price}
            className={inputClassName}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="stockQuantity" className={labelClassName}>
            Estoque
          </label>
          <input
            id="stockQuantity"
            name="stockQuantity"
            type="number"
            min="0"
            step="1"
            defaultValue={initialValues.stockQuantity}
            className={inputClassName}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="lowStockThreshold" className={labelClassName}>
            Alerta de estoque baixo
          </label>
          <input
            id="lowStockThreshold"
            name="lowStockThreshold"
            type="number"
            min="0"
            step="1"
            defaultValue={initialValues.lowStockThreshold}
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="flex items-center gap-3 rounded-2xl border border-brand-gray-mid bg-brand-black/30 px-4 py-3 text-sm text-white">
          <input
            type="checkbox"
            name="trackInventory"
            defaultChecked={initialValues.trackInventory}
            className="h-4 w-4 accent-brand-red"
          />
          Controlar estoque automaticamente.
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-brand-gray-mid bg-brand-black/30 px-4 py-3 text-sm text-white">
          <input
            type="checkbox"
            name="active"
            defaultChecked={initialValues.active}
            className="h-4 w-4 accent-brand-red"
          />
          Produto ativo para novas vendas.
        </label>
      </div>

      <ProductImageUploader value={images} onChange={setImages} disabled={isPending} />

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
          {mode === "create" ? "Criar produto" : "Salvar alteracoes"}
        </Button>
      </div>
    </form>
  );
}
