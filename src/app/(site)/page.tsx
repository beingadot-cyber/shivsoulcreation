import Link from "next/link";
import { ArrowRight, Heart, Package, Sparkles, Star, Truck } from "lucide-react";
import HeroCarousel from "@/components/HeroCarousel";
import FirstVisitGate from "@/components/FirstVisitGate";
import ProductCard from "@/components/ProductCard";
import { getHomeData } from "@/lib/data";

export default async function Home() {
  const home = await getHomeData();

  return (
    <>
      <FirstVisitGate />

      <HeroCarousel
        slides={home.hero.map((h) => ({
          id: h.id,
          mediaUrl: h.mediaUrl,
          mediaType: h.mediaType,
        }))}
      />

      {/* Trust strip */}
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:pt-8">
        <ul className="grid grid-cols-3 gap-2 rounded-2xl border border-gold/25 bg-white/70 px-2 py-3 sm:gap-4 sm:px-6">
          {[
            { icon: Heart, title: "Handmade with love" },
            { icon: Package, title: "Festive ready" },
            { icon: Truck, title: "Ships across India" },
          ].map((f) => (
            <li
              key={f.title}
              className="flex flex-col items-center gap-1 text-center sm:flex-row sm:justify-center sm:gap-2.5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blush text-rose sm:h-10 sm:w-10">
                <f.icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.7} />
              </span>
              <span className="text-[11px] leading-tight font-bold text-plum sm:text-sm">{f.title}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Featured products */}
      {home.featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.2em] text-rose uppercase">
                <Sparkles className="h-3.5 w-3.5" /> Handpicked for you
              </p>
              <h2 className="section-title">Featured Products</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {home.featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Bestsellers */}
      {home.bestsellers.length > 0 && (
        <section className="mt-12 bg-blush/60 py-12">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-5">
              <p className="mb-1 text-xs font-bold tracking-[0.2em] text-rose uppercase">Customer favourites</p>
              <h2 className="section-title">Bestsellers</h2>
            </div>
            <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:gap-5">
              {home.bestsellers.map((p) => (
                <div key={p.id} className="w-44 shrink-0 snap-start sm:w-56">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All products preview */}
      {home.products.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-bold tracking-[0.2em] text-rose uppercase">The collection</p>
              <h2 className="section-title">All Products</h2>
            </div>
            <Link href="/products" className="btn-outline hidden sm:inline-flex">
              View All Products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {home.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-6 text-center sm:hidden">
            <Link href="/products" className="btn-rose px-7 py-3">
              View All Products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Reels */}
      {home.reels.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-12">
          <div className="mb-5">
            <p className="mb-1 text-xs font-bold tracking-[0.2em] text-rose uppercase">Watch &amp; shop</p>
            <h2 className="section-title">From Our Studio</h2>
          </div>
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:gap-4">
            {home.reels.map((r) => (
              <figure key={r.id} className="w-40 shrink-0 snap-start sm:w-48">
                <video
                  src={r.videoUrl}
                  className="aspect-[9/16] w-full rounded-2xl border border-plum/10 bg-plum object-cover"
                  controls
                  muted
                  playsInline
                  preload="none"
                />
                {r.caption && (
                  <figcaption className="mt-2 line-clamp-1 text-xs font-semibold text-plumsoft">
                    {r.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Testimonials */}
      {home.testimonials.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-12">
          <div className="mb-5">
            <p className="mb-1 text-xs font-bold tracking-[0.2em] text-rose uppercase">Kind words</p>
            <h2 className="section-title">What Customers Say</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {home.testimonials.slice(0, 6).map((t) => (
              <blockquote key={t.id} className="card flex flex-col gap-3 p-5">
                <span className="flex gap-0.5 text-gold">
                  {Array.from({ length: Math.max(1, Math.min(5, t.rating)) }).map((_, i) => (
                    <Star key={i} className="h-4 w-4" fill="currentColor" strokeWidth={0} />
                  ))}
                </span>
                <p className="flex-1 text-sm leading-relaxed text-plum/90">“{t.message}”</p>
                <footer className="text-xs font-bold tracking-wider text-rosedeep uppercase">
                  — {t.customerName}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
