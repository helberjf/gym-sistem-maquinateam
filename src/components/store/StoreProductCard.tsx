"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Eye, Plus } from "lucide-react";
import { formatCurrencyFromCents } from "@/lib/billing/constants";
import { isLowStockProduct } from "@/lib/commerce/constants";
import type { StoreCatalogProductCard } from "@/lib/store/catalog";
import { Button } from "@/components/ui/Button";
import { AddToCartButton } from "@/components/store/AddToCartButton";
import { StoreFavoriteButton } from "@/components/store/StoreFavoriteButton";

type StoreProductCardProps = {
  product: StoreCatalogProductCard;
  initialIsFavorite?: boolean;
  interactiveEnabled?: boolean;
};

export function StoreProductCard({
  product,
  initialIsFavorite = false,
  interactiveEnabled = true,
}: StoreProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images =
    product.images.length > 0
      ? product.images
      : [{ url: "/images/logo.jpg", altText: product.name, isPrimary: true }];
  const currentImage = images[currentImageIndex] ?? images[0];
  const lowStock = isLowStockProduct({
    trackInventory: product.trackInventory,
    stockQuantity: product.stockQuantity,
    lowStockThreshold: product.lowStockThreshold,
    status: product.status,
  });
  const soldOut = product.trackInventory && product.stockQuantity <= 0;

  function handlePreviousImage(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setCurrentImageIndex((value) => (value === 0 ? images.length - 1 : value - 1));
  }

  function handleNextImage(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setCurrentImageIndex((value) => (value === images.length - 1 ? 0 : value + 1));
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative border-b border-neutral-200 bg-neutral-100">
        <Link href={`/loja/${product.slug}`} className="block">
          <img
            src={currentImage.url}
            alt={currentImage.altText ?? product.name}
            className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        </Link>

        {interactiveEnabled ? (
          <StoreFavoriteButton
            productId={product.id}
            productName={product.name}
            initialIsFavorite={initialIsFavorite}
            className="z-10"
          />
        ) : (
          <span className="absolute right-3 top-3 rounded-full border border-black/10 bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-600">
            Vitrine
          </span>
        )}

        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={handlePreviousImage}
              className="absolute left-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white/95 text-neutral-700 shadow-sm transition hover:border-black hover:text-black"
              aria-label="Imagem anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white/95 text-neutral-700 shadow-sm transition hover:border-black hover:text-black"
              aria-label="Proxima imagem"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        ) : null}

        {interactiveEnabled ? (
          <AddToCartButton
            productId={product.id}
            size="sm"
            label={<Plus className="h-4 w-4" />}
            className="absolute bottom-3 right-3 z-10 h-10 w-10 rounded-full p-0"
            disabled={soldOut}
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
            {product.category}
          </p>
          <div className="flex flex-wrap items-center justify-end gap-1">
            {product.featured ? (
              <span className="rounded-full bg-black px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                Destaque
              </span>
            ) : null}
            {soldOut ? (
              <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-700">
                Esgotado
              </span>
            ) : lowStock ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                Ultimas unidades
              </span>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Link href={`/loja/${product.slug}`}>
            <h3 className="line-clamp-2 text-lg font-semibold leading-tight text-neutral-950 transition group-hover:text-neutral-700">
              {product.name}
            </h3>
          </Link>
          <p className="line-clamp-2 text-sm leading-6 text-neutral-600">
            {product.shortDescription ??
              "Equipamento selecionado para treino, rotina e performance dentro da academia."}
          </p>
        </div>

        <div className="mt-auto space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">Preco</p>
              <p className="mt-1 text-2xl font-semibold text-neutral-950">
                {formatCurrencyFromCents(product.priceCents)}
              </p>
            </div>
            <p className="max-w-[9rem] text-right text-[11px] leading-5 text-neutral-500">
              {product.trackInventory
                ? `${product.stockQuantity} unidade(s) em estoque`
                : "Estoque sob consulta"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {interactiveEnabled ? (
              <AddToCartButton
                productId={product.id}
                size="md"
                className="w-full"
                label={soldOut ? "Indisponivel" : "Comprar"}
                disabled={soldOut}
              />
            ) : (
              <div className="inline-flex items-center justify-center rounded-xl border border-dashed border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-500">
                Em vitrine
              </div>
            )}
            <Button asChild variant="secondary" size="md" className="w-full border-neutral-300 text-neutral-900 hover:bg-neutral-100">
              <Link href={`/loja/${product.slug}`}>
                <Eye className="h-4 w-4" />
                Ver
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
