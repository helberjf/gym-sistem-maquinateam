export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-40 animate-pulse rounded-3xl border border-brand-gray-mid bg-brand-gray-dark" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl border border-brand-gray-mid bg-brand-gray-dark"
          />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-3xl border border-brand-gray-mid bg-brand-gray-dark" />
    </div>
  );
}
