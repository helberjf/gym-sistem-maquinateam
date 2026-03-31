type MetricCardProps = {
  label: string;
  value: string | number;
  note: string;
};

export function MetricCard({ label, value, note }: MetricCardProps) {
  return (
    <article className="rounded-2xl border border-brand-gray-mid bg-brand-gray-dark p-5">
      <p className="text-xs uppercase tracking-[0.14em] text-brand-gray-light">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      <p className="mt-3 text-sm text-brand-gray-light">{note}</p>
    </article>
  );
}
