import Link from "next/link";
import { Heart } from "lucide-react";
import { getStoreWishlistSummary } from "@/lib/store/favorites";

type StoreWishlistLinkProps = {
  mobile?: boolean;
};

export async function StoreWishlistLink({
  mobile = false,
}: StoreWishlistLinkProps) {
  const wishlist = await getStoreWishlistSummary();
  const countLabel = wishlist.count > 0 ? ` (${wishlist.count})` : "";

  return (
    <Link
      href="/favoritos"
      className={
        mobile
          ? "flex items-center gap-2 rounded-2xl border border-transparent px-4 py-3 text-sm text-brand-gray-light hover:border-brand-gray-mid hover:bg-brand-gray-dark hover:text-white"
          : "inline-flex items-center gap-1.5 text-sm font-medium text-brand-gray-light hover:text-white"
      }
    >
      <Heart className="h-4 w-4" />
      <span>Favoritos{countLabel}</span>
    </Link>
  );
}
