import { Flower2 } from "lucide-react";

/** Renders the product image or an elegant branded placeholder while the
 *  store owner has not uploaded a photo yet. */
export default function ProductImage({
  src,
  alt,
  className = "",
  code,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  code?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`aspect-square h-full w-full object-cover ${className}`}
      />
    );
  }
  return (
    <div
      className={`relative flex aspect-square h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-blush via-blushdeep/70 to-blush ${className}`}
      aria-label={alt}
    >
      <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_30%_20%,#fff_0,transparent_45%),radial-gradient(circle_at_75%_80%,#fff_0,transparent_40%)]" />
      <div className="relative flex flex-col items-center gap-2 text-rosedeep/70">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/70 shadow-sm">
          <Flower2 className="h-7 w-7" strokeWidth={1.5} />
        </span>
        <span className="px-3 text-center text-[11px] font-bold tracking-wider uppercase">
          Photo coming soon
        </span>
        {code && <span className="text-[10px] font-semibold opacity-70">{code}</span>}
      </div>
    </div>
  );
}
