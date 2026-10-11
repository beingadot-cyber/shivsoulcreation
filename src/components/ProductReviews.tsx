import { Star } from "lucide-react";
import { getProductReviews } from "@/lib/reviews";

export default function ProductReviews({ code, name }: { code: string; name: string }) {
  const reviews = getProductReviews(code, name);
  const avg = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <section className="mt-12">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-bold tracking-[0.2em] text-rose uppercase">Kind words</p>
          <h2 className="section-title">Customer Reviews</h2>
        </div>
        <p className="inline-flex items-center gap-1.5 text-sm font-bold text-plum">
          <Star className="h-4 w-4 text-gold" fill="currentColor" strokeWidth={0} /> {avg} average
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {reviews.map((r, i) => (
          <blockquote key={i} className="card flex flex-col gap-3 p-5">
            <span className="flex gap-0.5 text-gold">
              {Array.from({ length: r.rating }).map((_, j) => (
                <Star key={j} className="h-4 w-4" fill="currentColor" strokeWidth={0} />
              ))}
            </span>
            <p className="flex-1 text-sm leading-relaxed text-plum/90">“{r.message}”</p>
            <footer className="text-xs font-bold tracking-wider text-rosedeep uppercase">— {r.name}</footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
