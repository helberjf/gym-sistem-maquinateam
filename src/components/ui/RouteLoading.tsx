type RouteLoadingProps = {
  title?: string;
  description?: string;
};

export function RouteLoading({
  title = "Carregando",
  description,
}: RouteLoadingProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6 py-16">
      <div className="flex flex-col items-center gap-5 text-center">
        {/* Boxing glove SVG with punch animation */}
        <div className="relative h-20 w-20">
          <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-20 w-20 animate-[boxing-punch_1s_ease-in-out_infinite] drop-shadow-[0_0_16px_rgba(255,255,255,0.12)]"
          >
            {/* Wrist / arm */}
            <rect
              x="22"
              y="42"
              width="20"
              height="14"
              rx="4"
              className="fill-brand-gray-mid"
            />
            {/* Glove body */}
            <path
              d="M14 18c0-5.523 4.477-10 10-10h16c5.523 0 10 4.477 10 10v14c0 5.523-4.477 10-10 10H24c-5.523 0-10-4.477-10-10V18Z"
              className="fill-white"
            />
            {/* Thumb */}
            <ellipse
              cx="14"
              cy="26"
              rx="5"
              ry="8"
              className="fill-white"
            />
            {/* Glove lacing */}
            <path
              d="M24 12v4M32 12v4M40 12v4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-brand-gray-mid"
            />
            {/* Thumb outline detail */}
            <path
              d="M19 22a5 5 0 0 0-10 0v8a5 5 0 0 0 10 0"
              stroke="currentColor"
              strokeWidth="1.2"
              className="text-brand-gray-light/40"
              fill="none"
            />
          </svg>

          {/* Impact lines */}
          <span className="absolute -right-2 top-2 h-3 w-3 animate-ping rounded-full bg-white/30" />
          <span className="absolute -right-1 bottom-6 h-2 w-2 animate-ping rounded-full bg-white/20 [animation-delay:300ms]" />
        </div>

        <p className="text-sm font-medium uppercase tracking-[0.3em] text-brand-gray-light">
          {title}
        </p>

        {description ? (
          <p className="max-w-xs text-xs text-brand-gray-light/60">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
