type SimpleBarChartPoint = {
  label: string;
  value: number;
  note?: string;
};

type SimpleBarChartProps = {
  title: string;
  description: string;
  points: SimpleBarChartPoint[];
  emptyMessage?: string;
  formatter?: (value: number) => string;
  tone?: "red" | "sky" | "emerald" | "amber";
};

const toneClassMap: Record<NonNullable<SimpleBarChartProps["tone"]>, string> = {
  red: "from-brand-red to-brand-red-dark",
  sky: "from-zinc-200 to-zinc-500",
  emerald: "from-neutral-100 to-neutral-400",
  amber: "from-stone-200 to-stone-500",
};

export function SimpleBarChart({
  title,
  description,
  points,
  emptyMessage = "Sem dados suficientes para montar o grafico neste recorte.",
  formatter = (value) => String(value),
  tone = "red",
}: SimpleBarChartProps) {
  const maxValue = Math.max(...points.map((point) => point.value), 0);

  return (
    <article className="rounded-3xl border border-brand-gray-mid bg-brand-gray-dark p-6">
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="mt-1 text-sm text-brand-gray-light">{description}</p>
      </div>

      {points.length === 0 || maxValue <= 0 ? (
        <p className="mt-6 text-sm text-brand-gray-light">{emptyMessage}</p>
      ) : (
        <>
          <div className="mt-6 flex h-48 items-end gap-3">
            {points.map((point) => (
              <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-3">
                <p className="text-[11px] font-semibold text-white">
                  {formatter(point.value)}
                </p>
                <div className="flex h-36 w-full items-end justify-center rounded-2xl bg-brand-black/30 px-2 pb-2">
                  <div
                    className={[
                      "w-full rounded-xl bg-gradient-to-t transition-all",
                      toneClassMap[tone],
                    ].join(" ")}
                    style={{
                      height: `${Math.max(10, (point.value / maxValue) * 100)}%`,
                    }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-white">{point.label}</p>
                  {point.note ? (
                    <p className="mt-1 text-[11px] text-brand-gray-light">{point.note}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </article>
  );
}
