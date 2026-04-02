import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { CheckoutForm } from "@/components/store/CheckoutForm";
import { formatCurrencyFromCents } from "@/lib/billing/constants";
import { buildNoIndexMetadata } from "@/lib/seo";
import { getCheckoutPageData } from "@/lib/store/orders";

export const metadata = buildNoIndexMetadata({
  title: "Checkout",
  description:
    "Endereco, frete, cupom e criacao do pedido da loja da Maquina Team.",
  path: "/checkout",
});

export default async function CheckoutPage() {
  const data = await getCheckoutPageData();
  const cartItems = data.cart.items;
  const subtotalCents = cartItems.reduce(
    (total, item) => total + item.quantity * item.product.priceCents,
    0,
  );

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          title="Seu carrinho esta vazio"
          description="Adicione produtos na loja antes de abrir o checkout."
          actionLabel="Voltar para a loja"
          actionHref="/products"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.34em] text-brand-gray-light">
            Checkout
          </p>
          <h1 className="mt-3 text-4xl font-bold uppercase text-white sm:text-5xl">
            Finalizar compra
          </h1>
        </div>
        <Button asChild variant="ghost">
          <Link href="/carrinho">Voltar ao carrinho</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <CheckoutForm
          addresses={data.addresses}
          suggestedAddress={data.suggestedAddress}
          cartSubtotalCents={subtotalCents}
          customer={data.customer}
        />

        <aside className="space-y-5">
          <section className="rounded-[2rem] border border-brand-gray-mid bg-brand-gray-dark p-5">
            <h2 className="text-xl font-bold uppercase text-white">Itens do pedido</h2>
            <div className="mt-5 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-brand-gray-mid bg-brand-black/30 p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{item.product.name}</p>
                    <p className="mt-1 text-xs text-brand-gray-light">
                      {item.quantity} un x {formatCurrencyFromCents(item.product.priceCents)}
                    </p>
                  </div>
                  <strong className="text-white">
                    {formatCurrencyFromCents(item.quantity * item.product.priceCents)}
                  </strong>
                </div>
              ))}
            </div>
          </section>

          {data.user ? (
            <section className="hidden rounded-[2rem] border border-brand-gray-mid bg-brand-black p-5 text-white xl:block">
              <p className="text-xs uppercase tracking-[0.28em] text-white/55">
                Conta do cliente
              </p>
              <p className="mt-4 text-2xl font-bold uppercase">{data.user.name}</p>
              <p className="mt-2 text-sm text-white/70">{data.user.email}</p>
              <p className="mt-1 text-sm text-white/70">
                {data.user.phone ?? "Telefone nao informado"}
              </p>
              <p className="mt-4 text-sm leading-7 text-white/70">
                Este checkout gera um pedido vinculado a sua conta para acompanhamento
                de status e historico dentro do dashboard.
              </p>
            </section>
          ) : (
            <section className="hidden rounded-[2rem] border border-brand-gray-mid bg-brand-black p-5 text-white xl:block">
              <p className="text-xs uppercase tracking-[0.28em] text-white/55">
                Checkout sem login
              </p>
              <p className="mt-4 text-2xl font-bold uppercase">
                Finalize como visitante
              </p>
              <p className="mt-3 text-sm leading-7 text-white/70">
                Informe seus dados no formulario para pagar agora. Se preferir,
                voce tambem pode entrar para salvar enderecos, acompanhar pedidos
                no painel e acelerar as proximas compras.
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <Button asChild className="w-full">
                  <Link href="/login?callbackUrl=%2Fcheckout">Entrar</Link>
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/cadastro?callbackUrl=%2Fcheckout">Criar conta</Link>
                </Button>
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
