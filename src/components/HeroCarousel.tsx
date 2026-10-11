"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Flower2, Sparkles } from "lucide-react";

export type HeroSlide = { id: number; mediaUrl: string; mediaType: string };

export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1 || paused) return;
    const t = setInterval(() => setI((v) => (v + 1) % count), 3000);
    return () => clearInterval(t);
  }, [count, paused]);

  const go = (dir: number) => setI((v) => (v + dir + count) % count);

  if (count === 0) {
    // Branded placeholder until the admin uploads hero media
    return (
      <section className="mx-auto max-w-6xl px-4 pt-6">
        <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-gradient-to-br from-blush via-blushdeep to-blush">
          <div className="absolute inset-0 opacity-50 [background:radial-gradient(circle_at_20%_20%,#fff_0,transparent_45%),radial-gradient(circle_at_85%_75%,#fff_0,transparent_40%)]" />
          <div className="relative flex h-full flex-col items-center justify-center gap-2 px-4 text-center sm:gap-4 sm:px-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-rose shadow-sm sm:h-16 sm:w-16">
              <Flower2 className="h-5 w-5 sm:h-8 sm:w-8" strokeWidth={1.5} />
            </span>
            <h1 className="font-display max-w-xl text-xl leading-tight font-semibold text-plum sm:text-5xl">
              Handcrafted décor for homes that celebrate
            </h1>
            <p className="hidden max-w-md items-center gap-2 text-sm font-semibold text-rosedeep/90 sm:inline-flex sm:text-base">
              <Sparkles className="h-4 w-4 shrink-0" /> Torans · Shubh Labh · Diya Thalis · Festive Gifting
            </p>
            <Link href="/products" className="btn-rose mt-1 px-5 py-2 text-sm sm:mt-2 sm:px-7 sm:py-3 sm:text-base">
              Shop the Collection
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="mx-auto max-w-6xl px-4 pt-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative aspect-[16/9] overflow-hidden rounded-3xl">
        {slides.map((s, idx) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              idx === i ? "z-10 opacity-100" : "z-0 opacity-0"
            }`}
            aria-hidden={idx !== i}
          >
            {s.mediaType === "video" ? (
              <video
                src={s.mediaUrl}
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload={idx === i ? "auto" : "metadata"}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.mediaUrl}
                alt="Shiv Soul Creations"
                className="h-full w-full object-cover"
                loading={idx === 0 ? "eager" : "lazy"}
              />
            )}
          </div>
        ))}

        {count > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Previous slide"
              className="absolute top-1/2 left-2 z-20 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/80 text-plum shadow transition hover:bg-white sm:left-3 sm:h-10 sm:w-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next slide"
              className="absolute top-1/2 right-2 z-20 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/80 text-plum shadow transition hover:bg-white sm:right-3 sm:h-10 sm:w-10"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:bottom-4">
              {slides.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setI(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`h-2 cursor-pointer rounded-full transition-all ${
                    idx === i ? "w-6 bg-white" : "w-2 bg-white/60"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
