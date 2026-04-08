"use client";

import { useEffect, useMemo, useState } from "react";
import { Quote, Star } from "lucide-react";

const AUTOPLAY_DELAY_MS = 2500;

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

function ReviewCard({
  review,
  className = "",
}: {
  review: StudentReview;
  className?: string;
}) {
  return (
    <article
      className={[
        "flex h-full flex-col rounded-4xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur sm:p-6",
        className,
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-red text-sm font-bold uppercase tracking-[0.14em] text-black">
          {getAuthorInitials(review.author)}
        </div>

        <div className="flex items-center gap-1 text-[#e2b34d]">
          {Array.from({ length: review.rating }).map((_, index) => (
            <Star
              key={`${review.author}-star-${index}`}
              className="h-4 w-4 fill-current"
              strokeWidth={1.8}
            />
          ))}
        </div>
      </div>

      <Quote className="mt-5 h-8 w-8 text-brand-red" strokeWidth={1.7} />

      <p className="mt-4 flex-1 text-sm leading-7 text-white sm:text-base">
        "{review.text}"
      </p>

      <div className="mt-6 border-t border-white/10 pt-4">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white">
          {review.author}
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-brand-gray-light">
          Google Reviews
        </p>
      </div>
    </article>
  );
}

export function StudentTestimonialsCarousel({
  reviews,
}: StudentTestimonialsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const desktopSlides = useMemo(() => [...reviews, ...reviews], [reviews]);

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
      <div className="overflow-hidden rounded-[2.25rem] border border-brand-gray-mid bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%),linear-gradient(180deg,#101010,#050505)] p-4 shadow-[0_28px_110px_rgba(0,0,0,0.34)] sm:p-6">
        <div className="lg:hidden" aria-live="polite">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {reviews.map((review, index) => (
              <div
                key={`${review.author}-mobile-${index}`}
                className="w-full shrink-0"
              >
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        </div>

        <div className="hidden lg:block" aria-live="polite">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${currentIndex * (100 / 3)}%)` }}
          >
            {desktopSlides.map((review, index) => (
              <div
                key={`${review.author}-desktop-${index}`}
                className="w-1/3 shrink-0 px-2"
              >
                <ReviewCard review={review} className="min-h-[22rem]" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
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
      </div>
    </div>
  );
}
