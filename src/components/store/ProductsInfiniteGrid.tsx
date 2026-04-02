"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { StoreProductCard } from "@/components/store/StoreProductCard";
import type { StoreCatalogProductCard } from "@/lib/store/catalog";

type CatalogFiltersShape = {
  q?: string;
  category?: string;
  availability?: "all" | "in_stock" | "low_stock";
  sort?: string;
  priceMin?: number;
  priceMax?: number;
};

type ProductsInfiniteGridProps = {
  initialProducts: StoreCatalogProductCard[];
  initialFavoriteIds: string[];
  filters: CatalogFiltersShape;
  initialPagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
  };
  interactiveEnabled: boolean;
};

type CatalogApiResponse = {
  ok?: boolean;
  error?: string;
  products?: StoreCatalogProductCard[];
  favoriteIds?: string[];
  pagination?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
  };
};

function buildCatalogUrl(input: {
  filters: CatalogFiltersShape;
  page: number;
  limit: number;
}) {
  const params = new URLSearchParams();

  if (input.filters.q) {
    params.set("q", input.filters.q);
  }

  if (input.filters.category) {
    params.set("category", input.filters.category);
  }

  if (input.filters.availability) {
    params.set("availability", input.filters.availability);
  }

  if (input.filters.sort) {
    params.set("sort", input.filters.sort);
  }

  if (typeof input.filters.priceMin === "number") {
    params.set("priceMin", String(input.filters.priceMin));
  }

  if (typeof input.filters.priceMax === "number") {
    params.set("priceMax", String(input.filters.priceMax));
  }

  params.set("page", String(input.page));
  params.set("limit", String(input.limit));

  return `/api/store/catalog?${params.toString()}`;
}

export function ProductsInfiniteGrid({
  initialProducts,
  initialFavoriteIds,
  filters,
  initialPagination,
  interactiveEnabled,
}: ProductsInfiniteGridProps) {
  const [products, setProducts] = useState(initialProducts);
  const [favoriteIds, setFavoriteIds] = useState(initialFavoriteIds);
  const [pagination, setPagination] = useState(initialPagination);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    loadingMoreRef.current = loadingMore;
  }, [loadingMore]);

  useEffect(() => {
    if (!pagination.hasMore || !sentinelRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (
          !entry?.isIntersecting ||
          loadingMoreRef.current ||
          !pagination.hasMore
        ) {
          return;
        }

        setLoadingMore(true);
        loadingMoreRef.current = true;

        void fetch(
          buildCatalogUrl({
            filters,
            page: pagination.page + 1,
            limit: pagination.limit,
          }),
          { cache: "no-store" },
        )
          .then(async (response) => {
            const payload = (await response.json().catch(() => null)) as
              | CatalogApiResponse
              | null;

            if (!response.ok || !payload?.ok || !payload.products || !payload.pagination) {
              throw new Error(payload?.error ?? "Nao foi possivel carregar mais produtos.");
            }

            const nextProducts = payload.products;
            const nextPagination = payload.pagination;

            startTransition(() => {
              setProducts((current) => {
                const existingIds = new Set(current.map((item) => item.id));

                return [
                  ...current,
                  ...nextProducts.filter((item) => !existingIds.has(item.id)),
                ];
              });
              setFavoriteIds((current) =>
                Array.from(new Set([...current, ...(payload.favoriteIds ?? [])])),
              );
              setPagination(nextPagination);
            });
          })
          .catch((error) => {
            console.error("catalog infinite scroll error", error);
          })
          .finally(() => {
            loadingMoreRef.current = false;
            setLoadingMore(false);
          });
      },
      {
        rootMargin: "400px 0px",
      },
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [filters, pagination]);

  return (
    <div className="mt-6">
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <StoreProductCard
            key={product.id}
            product={product}
            initialIsFavorite={favoriteIds.includes(product.id)}
            interactiveEnabled={interactiveEnabled}
          />
        ))}
      </section>

      <div ref={sentinelRef} className="h-6" />

      {loadingMore ? (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm text-brand-gray-light">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Carregando mais produtos...
        </div>
      ) : null}

      {!pagination.hasMore && products.length > pagination.limit ? (
        <p className="mt-6 text-center text-xs uppercase tracking-[0.18em] text-brand-gray-light">
          Voce chegou ao fim da vitrine
        </p>
      ) : null}
    </div>
  );
}
