"use client";

import Link from "next/link";
import { StoreCartLink } from "@/components/store/StoreCartLink";
import { StoreWishlistLink } from "@/components/store/StoreWishlistLink";
import { Button } from "@/components/ui/Button";
import { usePublicViewer } from "@/components/public/usePublicViewer";

type NavbarClientControlsProps = {
  mode: "desktop" | "mobile-icons" | "mobile-menu";
};

export function NavbarClientControls({
  mode,
}: NavbarClientControlsProps) {
  const viewer = usePublicViewer();
  const isAuthenticated = viewer.isAuthenticated;

  if (mode === "desktop") {
    return (
      <>
        <StoreWishlistLink count={viewer.wishlistCount} />
        <StoreCartLink count={viewer.cartCount} />
        <Button asChild variant="ghost" size="sm">
          <Link href={isAuthenticated ? "/dashboard" : "/login"}>
            {isAuthenticated ? "Dashboard" : "Login"}
          </Link>
        </Button>
        {!isAuthenticated ? (
          <Button asChild size="sm">
            <Link href="/cadastro">Cadastrar</Link>
          </Button>
        ) : null}
      </>
    );
  }

  if (mode === "mobile-icons") {
    return (
      <>
        <StoreWishlistLink count={viewer.wishlistCount} mobile />
        <StoreCartLink count={viewer.cartCount} mobile />
      </>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-1 gap-3">
      <Link
        href={isAuthenticated ? "/dashboard" : "/login"}
        className="rounded-2xl border border-brand-gray-mid px-4 py-3 text-center text-sm font-semibold text-white"
      >
        {isAuthenticated ? "Abrir dashboard" : "Entrar"}
      </Link>
      {!isAuthenticated ? (
        <Link
          href="/cadastro"
          className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-black"
        >
          Criar conta
        </Link>
      ) : null}
    </div>
  );
}
