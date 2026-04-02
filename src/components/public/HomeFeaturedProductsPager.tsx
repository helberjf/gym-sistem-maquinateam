"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StoreProductCard } from "@/components/store/StoreProductCard";
import type { StoreCatalogProductCard } from "@/lib/store/catalog";

type HomeFeaturedProductsPagerProps = {
  products: StoreCatalogProductCard[];
};

function getItemsPerPage(width: number) {
  if (width >= 1280) {
    return 4;
  }

  if (width >= 768) {
    return 3;
  }

  return 2;
}

export function HomeFeaturedProductsPager({
  products,
}: HomeFeaturedProductsPagerProps) {
  const [itemsPerPage, setItemsPerPage] = useState(2);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    function handleResize() {
      setItemsPerPage(getItemsPerPage(window.innerWidth));
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(products.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages - 1) {
      setCurrentPage(totalPages - 1);
    }
  }, [currentPage, totalPages]);

  const visibleProducts = products.slice(
    currentPage * itemsPerPage,
    currentPage * itemsPerPage + itemsPerPage,
  );

  return (
    <div className="mt-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {visibleProducts.map((product) => (
          <StoreProductCard
            key={product.id}
            product={product}
            interactiveEnabled={true}
          />
        ))}
      </div>

      {totalPages > 1 ? (
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((value) => Math.max(0, value - 1))}
              disabled={currentPage === 0}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-gray-mid bg-brand-black/40 text-white transition hover:bg-brand-black disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Pagina anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentPage(index)}
                  className={[
                    "h-2.5 rounded-full transition",
                    index === currentPage
                      ? "w-8 bg-brand-red"
                      : "w-2.5 bg-brand-gray-mid hover:bg-brand-gray-light",
                  ].join(" ")}
                  aria-label={`Ir para pagina ${index + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((value) => Math.min(totalPages - 1, value + 1))
              }
              disabled={currentPage >= totalPages - 1}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-gray-mid bg-brand-black/40 text-white transition hover:bg-brand-black disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Proxima pagina"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <p className="text-xs uppercase tracking-[0.18em] text-brand-gray-light">
            Pagina {currentPage + 1} de {totalPages}
          </p>
        </div>
      ) : null}
    </div>
  );
}
