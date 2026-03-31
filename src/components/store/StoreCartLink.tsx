import Link from "next/link";
import { getCartSnapshot } from "@/lib/store/cart";

type StoreCartLinkProps = {
  mobile?: boolean;
};

export async function StoreCartLink({ mobile = false }: StoreCartLinkProps) {
  const cart = await getCartSnapshot();

  return (
    <Link
      href="/carrinho"
      className={
        mobile
          ? "block rounded-2xl border border-transparent px-4 py-3 text-sm text-brand-gray-light hover:border-brand-gray-mid hover:bg-brand-gray-dark hover:text-white"
          : "text-sm font-medium text-brand-gray-light hover:text-white"
      }
    >
      Carrinho {cart.summary.itemCount > 0 ? `(${cart.summary.itemCount})` : ""}
    </Link>
  );
}
