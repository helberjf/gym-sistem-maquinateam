import Link from "next/link";
import { Heart } from "lucide-react";

type StoreWishlistLinkProps = {
  count: number;
  mobile?: boolean;
};

export function StoreWishlistLink({
  count,
  mobile = false,
}: StoreWishlistLinkProps) {
  if (mobile) {
    return (
      <Link
        href="/favoritos"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-gray-mid bg-brand-gray-dark text-brand-gray-light transition hover:text-white"
        aria-label={`Favoritos${count > 0 ? ` (${count})` : ""}`}
      >
        <Heart className="h-5 w-5" />
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <Link
      href="/favoritos"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-gray-light transition hover:text-white"
      aria-label={`Favoritos${count > 0 ? ` (${count})` : ""}`}
    >
      <Heart className="h-5 w-5" />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
