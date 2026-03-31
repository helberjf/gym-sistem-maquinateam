import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <section className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-xs uppercase tracking-[0.24em] text-brand-red">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-2 text-3xl font-black text-white">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-brand-gray-light">
            {description}
          </p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </section>
  );
}
