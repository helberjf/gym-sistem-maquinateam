type AuthCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
};

const sizeMap: Record<NonNullable<AuthCardProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-xl",
};

export function AuthCard({ title, description, children, size = "md" }: AuthCardProps) {
  return (
    <div className={`w-full ${sizeMap[size]}`}>
      <div className="mb-6 text-center sm:mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-red sm:text-xs">
          Area segura
        </p>
        <h1 className="mt-3 text-3xl font-black uppercase text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-brand-gray-light">
          {description}
        </p>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-brand-gray-mid/80 bg-brand-gray-dark/95 p-6 shadow-[0_0_0_1px_rgba(200,16,46,0.12),0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur sm:rounded-[2rem] sm:p-8">
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-red/70 to-transparent" />
        {children}
      </div>
    </div>
  );
}
