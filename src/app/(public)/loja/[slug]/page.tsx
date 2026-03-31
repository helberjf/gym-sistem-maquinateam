import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/public/SectionHeading";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { StoreProductCard } from "@/components/store/StoreProductCard";
import { AddToCartButton } from "@/components/store/AddToCartButton";
import { formatCurrencyFromCents } from "@/lib/billing/constants";
import { getStoreProductDetail } from "@/lib/store/catalog";

type RouteParams = Promise<{ slug: string }>;

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const data = await getStoreProductDetail(slug);

    return {
      title: data.product.name,
      description:
        data.product.shortDescription ??
        "Produto da Maquina Team disponivel para compra no catalogo da academia.",
    };
  } catch {
    return {
      title: "Produto",
    };
  }
}

export default async function StoreProductDetailPage({
  params,
}: {
  params: RouteParams;
}) {
  try {
    const { slug } = await params;
    const data = await getStoreProductDetail(slug);
    const soldOut = data.product.trackInventory && data.product.stockQuantity <= 0;

    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button asChild variant="ghost">
            <Link href="/loja">Voltar para a loja</Link>
          </Button>
        </div>

        <section className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[2rem] border border-brand-gray-mid bg-brand-gray-dark">
              {data.product.images[0] ? (
                <img
                  src={data.product.images[0].url}
                  alt={data.product.images[0].altText ?? data.product.name}
                  className="aspect-[4/3] w-full object-cover grayscale"
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center text-sm text-brand-gray-light">
                  Sem imagem principal
                </div>
              )}
            </div>

            {data.product.images.length > 1 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {data.product.images.slice(1).map((image) => (
                  <div
                    key={image.id}
                    className="overflow-hidden rounded-2xl border border-brand-gray-mid bg-brand-gray-dark"
                  >
                    <img
                      src={image.url}
                      alt={image.altText ?? data.product.name}
                      className="aspect-[4/3] w-full object-cover grayscale"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="info">{data.product.category}</StatusBadge>
              {data.product.featured ? <StatusBadge tone="success">Destaque</StatusBadge> : null}
              {soldOut ? <StatusBadge tone="danger">Esgotado</StatusBadge> : null}
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-brand-gray-light">
                Loja da academia
              </p>
              <h1 className="mt-3 text-4xl font-bold uppercase text-white sm:text-5xl">
                {data.product.name}
              </h1>
              <p className="mt-4 text-base leading-7 text-brand-gray-light">
                {data.product.shortDescription ??
                  "Produto selecionado para a rotina de treino, compra e reposicao dentro da Maquina Team."}
              </p>
            </div>

            <div className="rounded-[2rem] border border-brand-gray-mid bg-brand-gray-dark p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-brand-gray-light">
                    Preco
                  </p>
                  <p className="mt-2 text-4xl font-bold text-white">
                    {formatCurrencyFromCents(data.product.priceCents)}
                  </p>
                </div>
                <div className="text-right text-sm text-brand-gray-light">
                  <p>SKU {data.product.sku}</p>
                  <p className="mt-1">
                    {data.product.trackInventory
                      ? `${data.product.stockQuantity} unidade(s) em estoque`
                      : "Estoque sob consulta"}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <AddToCartButton
                  productId={data.product.id}
                  className="w-full"
                  label={soldOut ? "Produto indisponivel" : "Adicionar ao carrinho"}
                  disabled={soldOut}
                />
                <Button asChild variant="secondary" size="lg" className="w-full">
                  <Link href="/carrinho">Ir para o carrinho</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-brand-gray-mid bg-brand-gray-dark p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-brand-gray-light">
                Descricao completa
              </p>
              <p className="mt-4 text-sm leading-7 text-brand-gray-light">
                {data.product.description ??
                  "Produto com curadoria da academia para treinos, rotina tecnica e reposicao de equipamento no dia a dia."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-brand-gray-mid bg-brand-gray-dark p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-brand-gray-light">
                  Peso
                </p>
                <p className="mt-3 text-xl font-bold text-white">
                  {data.product.weightGrams ? `${data.product.weightGrams} g` : "Nao informado"}
                </p>
              </div>
              <div className="rounded-2xl border border-brand-gray-mid bg-brand-gray-dark p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-brand-gray-light">
                  Dimensoes
                </p>
                <p className="mt-3 text-xl font-bold text-white">
                  {data.product.heightCm && data.product.widthCm && data.product.lengthCm
                    ? `${data.product.heightCm} x ${data.product.widthCm} x ${data.product.lengthCm}`
                    : "Nao informado"}
                </p>
              </div>
              <div className="rounded-2xl border border-brand-gray-mid bg-brand-gray-dark p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-brand-gray-light">
                  Entrega
                </p>
                <p className="mt-3 text-xl font-bold text-white">Pickup, local ou envio</p>
              </div>
            </div>
          </div>
        </section>

        {data.relatedProducts.length > 0 ? (
          <section className="mt-16">
            <SectionHeading
              eyebrow="Relacionados"
              title="Outros produtos da mesma linha"
              description="Continue montando seu kit com itens da mesma categoria."
            />
            <div className="mt-10 grid grid-cols-1 gap-5 xl:grid-cols-4">
              {data.relatedProducts.map((product) => (
                <StoreProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    );
  } catch {
    notFound();
  }
}
