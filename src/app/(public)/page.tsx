import type { Metadata } from "next";
import { auth } from "@/auth";
import { HomeLandingPage } from "@/components/public/HomeLandingPage";
import { getFeaturedPublicPlans } from "@/lib/billing/public";
import { getFeaturedProducts } from "@/lib/store/catalog";

export const metadata: Metadata = {
  title: "Maquina Team - Premium Fight Club",
  description: "Loja, planos e sistema da Maquina Team. Boxe, Muay Thai, Kickboxing e Funcional em Juiz de Fora.",
};

export const revalidate = 120;

export default async function PublicHomePage() {
  const [session, featuredPlans, featuredProducts] = await Promise.all([
    auth().catch(() => null),
    getFeaturedPublicPlans(3).catch(() => []),
    getFeaturedProducts().catch(() => []),
  ]);

  return (
    <HomeLandingPage
      featuredPlans={featuredPlans}
      featuredProducts={featuredProducts}
      isAuthenticated={Boolean(session?.user?.id)}
    />
  );
}
