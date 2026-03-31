type RouteLoadingProps = {
  title?: string;
  description?: string;
};

export function RouteLoading({
  title = "Carregando",
  description = "Estamos preparando a proxima etapa do painel.",
}: RouteLoadingProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg rounded-[2rem] border border-brand-gray-mid bg-brand-gray-dark/90 p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-brand-gray-mid bg-brand-black/60">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-gray-light/30 border-t-white" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-white">{title}</h1>
        <p className="mt-3 text-sm text-brand-gray-light">{description}</p>
      </div>
    </div>
  );
}
