import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { AnnouncementForm } from "@/components/dashboard/AnnouncementForm";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { getViewerContextFromSession } from "@/lib/academy/access";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Novo aviso",
  description: "Publique um comunicado para alunos, professores ou equipe interna.",
};

export default async function NewAnnouncementPage() {
  const session = await requirePermission(
    "manageAnnouncements",
    "/dashboard/avisos/novo",
  );
  const viewer = await getViewerContextFromSession(session);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Comunicacao"
        title="Novo aviso"
        description="Crie um aviso com publico-alvo, periodo de publicacao e destaque opcional no dashboard."
        action={
          <Button asChild variant="secondary">
            <Link href="/dashboard/avisos">Voltar para avisos</Link>
          </Button>
        }
      />

      <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
        <AnnouncementForm
          mode="create"
          endpoint="/api/announcements"
          viewerRole={viewer.role}
          initialValues={{
            title: "",
            slug: "",
            excerpt: "",
            content: "",
            targetRole: viewer.role === "PROFESSOR" ? "ALUNO" : "",
            isPinned: false,
            isPublished: true,
            publishedAt: "",
            expiresAt: "",
          }}
        />
      </section>
    </div>
  );
}
