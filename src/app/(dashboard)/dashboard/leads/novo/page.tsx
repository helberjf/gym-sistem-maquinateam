import type { Metadata } from "next";
import { UserRole } from "@prisma/client";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { LeadForm } from "@/components/dashboard/leads/LeadForm";
import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Novo lead",
  description: "Cadastre um novo prospect no pipeline.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewLeadPage() {
  const session = await requirePermission("manageLeads");

  const assignees = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: [UserRole.ADMIN, UserRole.RECEPCAO] },
    },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
    take: 200,
  });

  const assigneeOptions = assignees.map((user) => ({
    id: user.id,
    label: `${user.name} (${user.role === UserRole.ADMIN ? "Admin" : "Recepcao"})`,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CRM"
        title="Novo lead"
        description="Registre o contato e atribua um responsavel da equipe."
      />

      <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
        <LeadForm
          assigneeOptions={assigneeOptions}
          defaultAssigneeId={session.user.id}
        />
      </section>
    </div>
  );
}
