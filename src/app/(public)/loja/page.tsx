import type { Metadata } from "next";
import Link from "next/link";
import { Heart, ShoppingBag, TicketPercent, Truck } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StoreProductCard } from "@/components/store/StoreProductCard";
import { Button } from "@/components/ui/Button";
import { flattenSearchParams } from "@/lib/academy/presentation";
import { formatCurrencyFromCents } from "@/lib/billing/constants";
import { getStoreCatalogData } from "@/lib/store/catalog";
import { CATALOG_SORT_OPTIONS } from "@/lib/store/constants";
import { getStoreFavoriteProductIds } from "@/lib/store/favorites";
import { parseSearchParams } from "@/lib/validators";
import { catalogFiltersSchema } from "@/lib/validators/store";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Loja da Academia",
  description:
    "Catalogo publico da Maquina Team com equipamentos, acessorios e vestuario para treino.",
};

export const dynamic = "force-dynamic";

export default async function StorePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const rawSearchParams = await searchParams;
  const filters = parseSearchParams(
    flattenSearchParams(rawSearchParams),
    catalogFiltersSchema,
  );

  const [data, favoriteIds] = await Promise.all([
    getStoreCatalogData(filters),
    getStoreFavoriteProductIds(),
  ]);
  const favoriteIdSet = new Set(favoriteIds);
  const fallbackMode = data.source === "fallback";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <section className="rounded-[2.25rem] border border-neutral-200 bg-neutral-50 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-neutral-500">
              Loja da academia
            </p>
            <h1 className="mt-4 text-4xl font-semibold text-neutral-950 sm:text-5xl">
              Produtos para treino e rotina
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
              Camisetas, luvas, bandagens, caneleiras e acessorios escolhidos para a
              rotina da Maquina Team, com carrinho, cupom, frete e checkout
              integrados ao sistema.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/favoritos"
              className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900 transition hover:border-black"
            >
              <Heart className="h-4 w-4" />
              <span>Meus Favoritos</span>
            </Link>
            <Link
              href="/carrinho"
              className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900 transition hover:border-black"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Ver carrinho</span>
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <article className="rounded-[1.75rem] border border-neutral-200 bg-white p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
              <TicketPercent className="h-4 w-4" />
              Cupom
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-neutral-950">BEMVINDO10</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              Primeira compra com 10% de desconto em itens elegiveis acima de{" "}
              {formatCurrencyFromCents(12000)}. O cupom aparece no carrinho e no
              checkout.
            </p>
          </article>

          <article className="rounded-[1.75rem] border border-neutral-200 bg-white p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
              <ShoppingBag className="h-4 w-4" />
              Fluxo
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-neutral-950">
              Favoritos, carrinho e pedido
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              Salve seus itens, monte o carrinho como visitante ou aluno e finalize
              com pedido registrado dentro da area do cliente.
            </p>
          </article>

          <article className="rounded-[1.75rem] border border-neutral-200 bg-white p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
              <Truck className="h-4 w-4" />
              Entrega
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-neutral-950">
              Retirada, entrega local ou envio
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              Escolha frete no checkout com calculo interno preparado para evoluir
              depois para transportadora real.
            </p>
          </article>
        </div>

        {fallbackMode ? (
          <div className="mt-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Modo vitrine
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              Este ambiente nao conseguiu carregar o catalogo principal agora, entao a
              loja exibiu uma vitrine segura inspirada no seed. Assim que a conexao do
              banco estabilizar, o modo completo volta automaticamente.
            </p>
          </div>
        ) : null}
      </section>

      <section className="mt-6 rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm">
        <form className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.25fr)_repeat(5,minmax(0,1fr))]">
          <input
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Busque por nome, categoria ou descricao"
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-black"
          />
          <select
            name="category"
            defaultValue={filters.category ?? ""}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-black"
          >
            <option value="">Todas as categorias</option>
            {data.categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <input
            name="priceMin"
            type="number"
            min="0"
            step="1"
            defaultValue={filters.priceMin ?? ""}
            placeholder="Preco min."
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-black"
          />
          <input
            name="priceMax"
            type="number"
            min="0"
            step="1"
            defaultValue={filters.priceMax ?? ""}
            placeholder="Preco max."
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-black"
          />
          <select
            name="availability"
            defaultValue={filters.availability}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-black"
          >
            <option value="all">Toda disponibilidade</option>
            <option value="in_stock">Somente em estoque</option>
            <option value="low_stock">Estoque baixo</option>
          </select>
          <select
            name="sort"
            defaultValue={filters.sort}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-black"
          >
            {CATALOG_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-3 xl:col-start-6">
            <Button type="submit" variant="secondary" className="w-full border-neutral-300 text-neutral-900 hover:bg-neutral-100">
              Filtrar
            </Button>
            <Button asChild variant="ghost" className="w-full text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900">
              <Link href="/loja">Limpar</Link>
            </Button>
          </div>
        </form>
      </section>

      <section className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">
            Catalogo
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            {data.summary.totalProducts} produto(s) visivel(is)
          </h2>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-brand-gray-light">
          <span className="rounded-full border border-brand-gray-mid px-4 py-2">
            {data.summary.featuredProducts} destaque(s)
          </span>
          <span className="rounded-full border border-brand-gray-mid px-4 py-2">
            {data.summary.inStockProducts} em estoque
          </span>
        </div>
      </section>

      {data.products.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Nenhum produto encontrado"
            description="Ajuste os filtros para localizar outros itens da loja."
            actionLabel="Limpar filtros"
            actionHref="/loja"
          />
        </div>
      ) : (
        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.products.map((product) => (
            <StoreProductCard
              key={product.id}
              product={product}
              initialIsFavorite={favoriteIdSet.has(product.id)}
              interactiveEnabled={!fallbackMode}
            />
          ))}
        </section>
      )}
    </div>
  );
}
