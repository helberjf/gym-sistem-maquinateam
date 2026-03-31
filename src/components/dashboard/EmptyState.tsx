import Link from "next/link";
import { Button } from "@/components/ui/Button";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-gray-mid bg-brand-black/30 p-6 text-center">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <p className="mt-2 text-sm text-brand-gray-light">{description}</p>
      {actionLabel && actionHref ? (
        <div className="mt-4">
          <Button asChild>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
