import { ProductStatus } from "@prisma/client";
import Link from "next/link";
import { formatCurrencyFromCents } from "@/lib/billing/constants";
import { isLowStockProduct } from "@/lib/commerce/constants";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { AddToCartButton } from "@/components/store/AddToCartButton";

type StoreProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    category: string;
    shortDescription: string | null;
    priceCents: number;
    stockQuantity: number;
    lowStockThreshold: number;
    trackInventory: boolean;
    status: ProductStatus;
    featured: boolean;
    images: Array<{
      url: string;
      altText: string | null;
    }>;
  };
};

export function StoreProductCard({ product }: StoreProductCardProps) {
  const lowStock = isLowStockProduct({
    trackInventory: product.trackInventory,
    stockQuantity: product.stockQuantity,
    lowStockThreshold: product.lowStockThreshold,
    status: product.status,
  });
  const soldOut = product.trackInventory && product.stockQuantity <= 0;

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-brand-gray-mid bg-brand-gray-dark">
      <Link href={`/loja/${product.slug}`} className="block">
        <div className="overflow-hidden border-b border-brand-gray-mid bg-brand-black/60">
          {product.images[0] ? (
            <img
              src={product.images[0].url}
              alt={product.images[0].altText ?? product.name}
              className="aspect-[4/3] w-full object-cover grayscale transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center text-sm text-brand-gray-light">
              Sem imagem
            </div>
          )}
        </div>
      </Link>

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="info">{product.category}</StatusBadge>
          {product.featured ? <StatusBadge tone="success">Destaque</StatusBadge> : null}
          {soldOut ? (
            <StatusBadge tone="danger">Esgotado</StatusBadge>
          ) : lowStock ? (
            <StatusBadge tone="warning">Ultimas unidades</StatusBadge>
          ) : null}
        </div>

        <div>
          <Link href={`/loja/${product.slug}`}>
            <h3 className="text-2xl font-bold uppercase text-white transition group-hover:text-brand-gray-light">
              {product.name}
            </h3>
          </Link>
          <p className="mt-3 text-sm leading-6 text-brand-gray-light">
            {product.shortDescription ?? "Equipamento selecionado para treino, rotina e performance dentro da academia."}
          </p>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-brand-gray-light">Preco</p>
            <p className="mt-2 text-2xl font-bold text-white">
              {formatCurrencyFromCents(product.priceCents)}
            </p>
          </div>
          <p className="text-xs uppercase tracking-[0.18em] text-brand-gray-light">
            {product.trackInventory ? `${product.stockQuantity} un em estoque` : "Estoque livre"}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AddToCartButton
            productId={product.id}
            className="w-full"
            label={soldOut ? "Indisponivel" : "Comprar"}
            disabled={soldOut}
          />
          <Button asChild variant="secondary" size="lg" className="w-full">
            <Link href={`/loja/${product.slug}`}>Ver detalhes</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
