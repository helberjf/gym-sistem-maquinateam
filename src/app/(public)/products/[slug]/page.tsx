import { redirect } from "next/navigation";

type RouteParams = Promise<{ slug: string }>;

export default async function ProductDetailRedirectPage({
  params,
}: {
  params: RouteParams;
}) {
  const { slug } = await params;
  redirect(`/loja/${slug}`);
}
