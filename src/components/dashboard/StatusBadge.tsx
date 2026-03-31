import type { ReactNode } from "react";

type StatusBadgeProps = {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  children: ReactNode;
};

const toneClassMap: Record<NonNullable<StatusBadgeProps["tone"]>, string> = {
  neutral: "border-brand-gray-mid bg-brand-black/40 text-brand-gray-light",
  success: "border-brand-white/15 bg-brand-white/5 text-brand-white",
  warning: "border-brand-gray-light/25 bg-brand-gray-mid/60 text-brand-white",
  danger: "border-brand-gray-light/20 bg-brand-black/70 text-brand-white",
  info: "border-brand-gray-mid bg-brand-black/50 text-brand-white",
};

export function StatusBadge({
  tone = "neutral",
  children,
}: StatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        toneClassMap[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
}
