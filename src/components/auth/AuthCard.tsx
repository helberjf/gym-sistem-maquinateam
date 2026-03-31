type AuthCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-gray-light">
          Area segura
        </p>
        <h1 className="mt-3 text-4xl font-black uppercase text-white">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-brand-gray-light">{description}</p>
      </div>

      <div className="rounded-[2rem] border border-brand-gray-mid bg-brand-gray-dark/95 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.4)] backdrop-blur">
        {children}
      </div>
    </div>
  );
}
