import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ProductSaleForm } from "@/components/dashboard/ProductSaleForm";
import { requirePermission } from "@/lib/auth/guards";
import { getViewerContextFromSession } from "@/lib/academy/access";
import { toDateInputValue } from "@/lib/academy/constants";
import { getSaleOptions } from "@/lib/commerce/service";

export const metadata: Metadata = {
  title: "Nova venda",
  description: "Registre uma venda de produtos e atualize o estoque automaticamente.",
};

export default async function NewProductSalePage() {
  const session = await requirePermission("manageSales", "/dashboard/vendas/nova");
  const viewer = await getViewerContextFromSession(session);
  const options = await getSaleOptions(viewer);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Comercio"
        title="Nova venda"
        description="Monte os itens da venda, vincule ao aluno quando fizer sentido e registre a movimentacao financeira do balcao."
        action={
          <Button asChild variant="secondary">
            <Link href="/dashboard/vendas">Voltar para vendas</Link>
          </Button>
        }
      />

      <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
        <ProductSaleForm
          endpoint="/api/product-sales"
          initialValues={{
            studentProfileId: "",
            customerName: "",
            customerDocument: "",
            paymentMethod: "PIX",
            status: "PAID",
            discount: "0.00",
            soldAt: toDateInputValue(new Date()),
            notes: "",
            items: [{ productId: "", quantity: 1 }],
          }}
          options={{
            students:
              options?.students.map((student) => ({
                id: student.id,
                name: student.user.name,
                registrationNumber: student.registrationNumber,
              })) ?? [],
            products:
              options?.products.map((product) => ({
                id: product.id,
                name: product.name,
                category: product.category,
                priceCents: product.priceCents,
                stockQuantity: product.stockQuantity,
                trackInventory: product.trackInventory,
                imageUrl: product.images[0]?.url ?? null,
              })) ?? [],
          }}
        />
      </section>
    </div>
  );
}
