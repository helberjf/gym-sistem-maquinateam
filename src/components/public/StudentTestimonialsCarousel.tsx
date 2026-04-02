"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";

const AUTOPLAY_DELAY_MS = 1500;

type StudentReview = {
  author: string;
  text: string;
  rating: number;
};

type StudentTestimonialsCarouselProps = {
  reviews: readonly StudentReview[];
};

function getAuthorInitials(author: string) {
  return author
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function StudentTestimonialsCarousel({
  reviews,
}: StudentTestimonialsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (reviews.length <= 1) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCurrentIndex((value) => (value + 1) % reviews.length);
    }, AUTOPLAY_DELAY_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [reviews.length]);

  useEffect(() => {
    if (currentIndex > reviews.length - 1) {
      setCurrentIndex(0);
    }
  }, [currentIndex, reviews.length]);

  if (reviews.length === 0) {
    return null;
  }

  return (
    <div className="mt-10">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-brand-gray-mid bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_32%),linear-gradient(180deg,#111111,#050505)] p-1 shadow-[0_30px_110px_rgba(0,0,0,0.42)]">
        <div className="rounded-[2.2rem] border border-white/5 bg-black/70 p-5 sm:p-7 lg:p-8">
          <div className="overflow-hidden" aria-live="polite">
            <div
              className="flex transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {reviews.map((review, index) => (
                <article
                  key={`${review.author}-${index}`}
                  className="grid w-full shrink-0 gap-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-end"
                >
                  <div className="min-w-0">
                    <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-gray-light">
                      Alunos da Maquina Team
                    </div>

                    <Quote className="mt-6 h-11 w-11 text-brand-red" strokeWidth={1.6} />

                    <div className="mt-5 flex items-center gap-1 text-[#e2b34d]">
                      {Array.from({ length: review.rating }).map((_, starIndex) => (
                        <Star
                          key={starIndex}
                          className="h-4 w-4 fill-current"
                          strokeWidth={1.8}
                        />
                      ))}
                    </div>

                    <p className="mt-6 max-w-3xl text-lg leading-8 text-white sm:text-2xl sm:leading-9 lg:text-[2rem] lg:leading-[1.45]">
                      "{review.text}"
                    </p>

                    <div className="mt-8 flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-red text-sm font-bold uppercase tracking-[0.14em] text-black">
                        {getAuthorInitials(review.author)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold uppercase tracking-[0.18em] text-white">
                          {review.author}
                        </p>
                        <p className="mt-1 text-sm text-brand-gray-light">
                          Depoimento real da referencia oficial da academia
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.9rem] border border-brand-gray-mid bg-white/[0.04] p-5 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.24em] text-brand-gray-light">
                      Carrossel de alunos
                    </p>
                    <p className="mt-3 text-3xl font-bold uppercase text-white">
                      0{index + 1}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-brand-gray-light">
                      Rotacao automatica a cada 1,5 segundos, mantendo o fim da
                      landing mais vivo e social proof mais visivel.
                    </p>

                    <div className="mt-5 space-y-2">
                      {reviews.map((item, itemIndex) => (
                        <button
                          key={`${item.author}-${itemIndex}`}
                          type="button"
                          onClick={() => setCurrentIndex(itemIndex)}
                          className={[
                            "flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm transition",
                            itemIndex === currentIndex
                              ? "border-brand-red bg-brand-red/12 text-white"
                              : "border-white/10 bg-black/20 text-brand-gray-light hover:border-white/20 hover:bg-white/[0.05]",
                          ].join(" ")}
                          aria-label={`Exibir depoimento de ${item.author}`}
                        >
                          <span className="truncate">{item.author}</span>
                          <span
                            className={[
                              "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                              itemIndex === currentIndex
                                ? "bg-brand-red text-black"
                                : "bg-white/10 text-brand-gray-light",
                            ].join(" ")}
                          >
                            {itemIndex === currentIndex ? "Ativo" : "Ver"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {reviews.map((review, index) => (
                <button
                  key={`${review.author}-indicator-${index}`}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={[
                    "h-2.5 rounded-full transition",
                    index === currentIndex
                      ? "w-10 bg-brand-red"
                      : "w-2.5 bg-white/20 hover:bg-white/40",
                  ].join(" ")}
                  aria-label={`Ir para o depoimento ${index + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setCurrentIndex((value) =>
                    value === 0 ? reviews.length - 1 : value - 1,
                  )
                }
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/[0.1]"
                aria-label="Depoimento anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <p className="text-xs uppercase tracking-[0.18em] text-brand-gray-light">
                Depoimento {currentIndex + 1} de {reviews.length}
              </p>

              <button
                type="button"
                onClick={() =>
                  setCurrentIndex((value) => (value + 1) % reviews.length)
                }
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/[0.1]"
                aria-label="Proximo depoimento"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
