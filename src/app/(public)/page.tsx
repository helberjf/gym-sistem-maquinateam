import type { Metadata } from "next";
import { HomeLandingPage } from "@/components/public/HomeLandingPage";

export const metadata: Metadata = {
  title: "Home",
  description: "Site oficial da Maquina Team com planos, contato, FAQ e acesso ao sistema.",
};

export default function PublicHomePage() {
  return <HomeLandingPage />;
}
