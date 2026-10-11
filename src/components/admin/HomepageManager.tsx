"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader2,
  Pencil,
  Star,
  Trash2,
  Video,
  Check,
} from "lucide-react";
import ProductImage from "@/components/ProductImage";

type Hero = { id: number; mediaUrl: string; mediaType: string; isEnabled: boolean };
type Reel = { id: number; videoUrl: string; caption: string; isEnabled: boolean };
type Testimonial = {
  id: number;
  customerName: string;
  message: string;
  rating: number;
  isPublished: boolean;
};
type Product = {
  id: number;
  productCode: string;
  name: string;
  imageUrl: string | null;
  isFeatured: boolean;
  isBestseller: boolean;
};

async function uploadMedia(file: File, kind: "hero" | "reel") {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("kind", kind);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || "Upload failed.");
  return data as { url: string; mediaType: string };
}

async function api(url: string, method: string, body?: Record<string, unknown>) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-plum/10 px-5 py-4">
        <h2 className="font-display text-lg font-semibold text-plum">{title}</h2>
        <p className="mt-0.5 text-xs font-semibold text-plumsoft">{hint}</p>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function HomepageManager({
  hero: heroInit,
  reels: reelsInit,
  testimonials: testiInit,
  products: productsInit,
}: {
  hero: Hero[];
  reels: Reel[];
  testimonials: Testimonial[];
  products: Product[];
}) {
  const router = useRouter();
  const [hero, setHero] = useState(heroInit);
  const [reels, setReels] = useState(reelsInit);
  const [testis, setTestis] = useState(testiInit);
  const [products, setProducts] = useState(productsInit);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const heroFileRef = useRef<HTMLInputElement>(null);
  const reelFileRef = useRef<HTMLInputElement>(null);
  const replaceHeroRef = useRef<HTMLInputElement>(null);
  const replaceReelRef = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<{ kind: "hero" | "reel"; id: number } | null>(null);

  const [reelCaption, setReelCaption] = useState("");
  const [tName, setTName] = useState("");
  const [tMessage, setTMessage] = useState("");
  const [tRating, setTRating] = useState("5");
  const [editT, setEditT] = useState<Testimonial | null>(null);
  const [pickerQ, setPickerQ] = useState("");

  const featuredCount = products.filter((p) => p.isFeatured).length;

  /* ---------------- Hero ---------------- */
  async function addHero(file: File) {
    setError("");
    setBusy(true);
    try {
      const up = await uploadMedia(file, "hero");
      await api("/api/admin/hero", "POST", { mediaUrl: up.url, mediaType: up.mediaType });
      router.refresh();
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
      setBusy(false);
    }
  }

  async function heroAction(id: number, body: Record<string, unknown>, optimistic?: Partial<Hero>) {
    if (optimistic) setHero((l) => l.map((h) => (h.id === id ? { ...h, ...optimistic } : h)));
    await api("/api/admin/hero", "PATCH", { id, ...body });
    router.refresh();
  }

  async function heroDelete(id: number) {
    setHero((l) => l.filter((h) => h.id !== id));
    await api("/api/admin/hero", "DELETE", { id });
    router.refresh();
  }

  /* ---------------- Reels ---------------- */
  async function addReel(file: File) {
    setError("");
    setBusy(true);
    try {
      const up = await uploadMedia(file, "reel");
      if (up.mediaType !== "video") throw new Error("Reels must be videos (MP4/WebM).");
      await api("/api/admin/reels", "POST", { videoUrl: up.url, caption: reelCaption });
      setReelCaption("");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
      setBusy(false);
    }
  }

  /* ---------------- Testimonials ---------------- */
  async function addTestimonial(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await api("/api/admin/testimonials", "POST", {
      customerName: tName,
      message: tMessage,
      rating: Number(tRating),
    });
    if (res.error) {
      setError(res.error);
      return;
    }
    setTName("");
    setTMessage("");
    setTRating("5");
    window.location.reload();
  }

  async function saveEditTestimonial() {
    if (!editT) return;
    await api("/api/admin/testimonials", "PATCH", { ...editT });
    setEditT(null);
    router.refresh();
  }

  /* ---------------- Product flags ---------------- */
  async function toggleFlag(p: Product, field: "isFeatured" | "isBestseller") {
    const next = !p[field];
    if (field === "isFeatured" && next && featuredCount >= 4) {
      setError("Featured section shows exactly 4 products — unselect one first.");
      return;
    }
    setError("");
    setProducts((l) => l.map((x) => (x.id === p.id ? { ...x, [field]: next } : x)));
    await api(`/api/admin/products/${p.id}`, "PATCH", { [field]: next });
    router.refresh();
  }

  const pickerList = useMemo(() => {
    const n = pickerQ.trim().toLowerCase();
    if (!n) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(n) || p.productCode.toLowerCase().includes(n)
    );
  }, [products, pickerQ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-plum">Homepage Manager</h1>
        <p className="mt-1 text-sm font-semibold text-plumsoft">
          Control what visitors see on the homepage — hero slides, featured picks, reels and testimonials.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">{error}</div>
      )}

      {/* HERO MEDIA */}
      <Section
        title="Hero Slides"
        hint="Up to 4 recommended · auto-changes every 3 seconds · images (≤4 MB) or videos (≤15 MB)"
      >
        <input
          ref={heroFileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) addHero(f);
            e.target.value = "";
          }}
        />
        <input
          ref={replaceHeroRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f || !replaceTarget.current) return;
            setBusy(true);
            try {
              const up = await uploadMedia(f, "hero");
              await heroAction(replaceTarget.current.id, {
                mediaUrl: up.url,
                mediaType: up.mediaType,
              });
              setHero((l) =>
                l.map((h) =>
                  h.id === replaceTarget.current!.id
                    ? { ...h, mediaUrl: up.url, mediaType: up.mediaType }
                    : h
                )
              );
            } catch (err) {
              setError(err instanceof Error ? err.message : "Upload failed.");
            } finally {
              setBusy(false);
            }
          }}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {hero.map((s, idx) => (
            <div key={s.id} className="overflow-hidden rounded-xl border border-plum/10">
              <div className="relative aspect-video bg-plum/5">
                {s.mediaType === "video" ? (
                  <video src={s.mediaUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.mediaUrl} alt={`Slide ${idx + 1}`} className="h-full w-full object-cover" loading="lazy" />
                )}
                <span className="absolute top-2 left-2 rounded-full bg-plum/80 px-2 py-0.5 text-[10px] font-bold text-white">
                  #{idx + 1}
                </span>
                {!s.isEnabled && (
                  <span className="absolute top-2 right-2 rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
                    Hidden
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 p-2">
                <div className="flex gap-1">
                  <button
                    onClick={() => heroAction(s.id, { move: "up" })}
                    disabled={idx === 0}
                    aria-label="Move up"
                    className="cursor-pointer rounded-lg bg-blush p-1.5 text-rosedeep transition hover:bg-blushdeep disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => heroAction(s.id, { move: "down" })}
                    disabled={idx === hero.length - 1}
                    aria-label="Move down"
                    className="cursor-pointer rounded-lg bg-blush p-1.5 text-rosedeep transition hover:bg-blushdeep disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      replaceTarget.current = { kind: "hero", id: s.id };
                      replaceHeroRef.current?.click();
                    }}
                    aria-label="Replace media"
                    className="cursor-pointer rounded-lg bg-blush p-1.5 text-rosedeep transition hover:bg-blushdeep"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="flex cursor-pointer items-center gap-1 text-[10px] font-bold text-plumsoft">
                    <input
                      type="checkbox"
                      checked={s.isEnabled}
                      onChange={(e) => heroAction(s.id, { isEnabled: e.target.checked }, { isEnabled: e.target.checked })}
                      className="h-3.5 w-3.5 accent-rose-600"
                    />
                    Show
                  </label>
                  <button
                    onClick={() => heroDelete(s.id)}
                    aria-label="Delete slide"
                    className="cursor-pointer rounded-lg bg-red-50 p-1.5 text-red-500 transition hover:bg-red-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {hero.length < 8 && (
            <button
              onClick={() => heroFileRef.current?.click()}
              disabled={busy}
              className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-plum/20 text-plumsoft transition hover:border-rose hover:text-rose disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
              <span className="text-xs font-bold">Add slide</span>
            </button>
          )}
        </div>
      </Section>

      {/* FEATURED & BESTSELLERS */}
      <Section
        title={`Featured Products (${featuredCount}/4) & Bestsellers`}
        hint="Pick exactly 4 featured products for the homepage; bestsellers appear in their own strip"
      >
        <input
          value={pickerQ}
          onChange={(e) => setPickerQ(e.target.value)}
          placeholder="Search products…"
          className="input mb-3 max-w-sm"
        />
        <div className="no-scrollbar max-h-96 space-y-1.5 overflow-y-auto pr-1">
          {pickerList.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl border border-plum/10 px-3 py-2">
              <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-plum/10">
                <ProductImage src={p.imageUrl} alt={p.name} code={p.productCode} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-bold">{p.name}</p>
                <p className="font-mono text-[11px] font-semibold text-plumsoft">{p.productCode}</p>
              </div>
              <button
                onClick={() => toggleFlag(p, "isFeatured")}
                aria-pressed={p.isFeatured}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                  p.isFeatured ? "bg-plum text-white" : "bg-plum/10 text-plumsoft hover:bg-plum/20"
                }`}
              >
                Featured
              </button>
              <button
                onClick={() => toggleFlag(p, "isBestseller")}
                aria-pressed={p.isBestseller}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                  p.isBestseller ? "bg-gold text-white" : "bg-plum/10 text-plumsoft hover:bg-plum/20"
                }`}
              >
                <Star className="mr-0.5 inline h-3 w-3" /> Bestseller
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* REELS */}
      <Section title="Product Reels" hint="Short vertical videos (MP4/WebM, ≤15 MB) shown on the homepage">
        <input
          ref={reelFileRef}
          type="file"
          accept="video/mp4,video/webm"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) addReel(f);
            e.target.value = "";
          }}
        />
        <input
          ref={replaceReelRef}
          type="file"
          accept="video/mp4,video/webm"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f || !replaceTarget.current) return;
            setBusy(true);
            try {
              const up = await uploadMedia(f, "reel");
              await api("/api/admin/reels", "PATCH", { id: replaceTarget.current.id, videoUrl: up.url });
              setReels((l) =>
                l.map((r) => (r.id === replaceTarget.current!.id ? { ...r, videoUrl: up.url } : r))
              );
            } catch (err) {
              setError(err instanceof Error ? err.message : "Upload failed.");
            } finally {
              setBusy(false);
            }
          }}
        />
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={reelCaption}
            onChange={(e) => setReelCaption(e.target.value)}
            placeholder="Caption for the new reel (optional)…"
            className="input flex-1"
            maxLength={200}
          />
          <button onClick={() => reelFileRef.current?.click()} disabled={busy} className="btn-rose shrink-0">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
            Add Reel
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {reels.map((r) => (
            <div key={r.id} className="overflow-hidden rounded-xl border border-plum/10">
              <video src={r.videoUrl} className="aspect-[9/16] w-full bg-plum object-cover" muted playsInline preload="metadata" controls />
              <div className="p-2">
                <p className="mb-2 line-clamp-1 text-[11px] font-semibold text-plumsoft">{r.caption || "—"}</p>
                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-1 text-[10px] font-bold text-plumsoft">
                    <input
                      type="checkbox"
                      checked={r.isEnabled}
                      onChange={async (e) => {
                        setReels((l) => l.map((x) => (x.id === r.id ? { ...x, isEnabled: e.target.checked } : x)));
                        await api("/api/admin/reels", "PATCH", { id: r.id, isEnabled: e.target.checked });
                        router.refresh();
                      }}
                      className="h-3.5 w-3.5 accent-rose-600"
                    />
                    Show
                  </label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        replaceTarget.current = { kind: "reel", id: r.id };
                        replaceReelRef.current?.click();
                      }}
                      aria-label="Replace reel"
                      className="cursor-pointer rounded-lg bg-blush p-1.5 text-rosedeep transition hover:bg-blushdeep"
                    >
                      <Video className="h-3 w-3" />
                    </button>
                    <button
                      onClick={async () => {
                        setReels((l) => l.filter((x) => x.id !== r.id));
                        await api("/api/admin/reels", "DELETE", { id: r.id });
                        router.refresh();
                      }}
                      aria-label="Delete reel"
                      className="cursor-pointer rounded-lg bg-red-50 p-1.5 text-red-500 transition hover:bg-red-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {reels.length === 0 && (
            <p className="col-span-full py-6 text-center text-sm font-semibold text-plumsoft">
              No reels yet — add your first product reel above.
            </p>
          )}
        </div>
      </Section>

      {/* TESTIMONIALS */}
      <Section title="Testimonials" hint="Add genuine customer reviews only — they appear on the homepage">
        <form onSubmit={addTestimonial} className="mb-5 grid gap-2 rounded-xl border border-plum/10 p-3 sm:grid-cols-[180px_1fr_auto]">
          <input
            value={tName}
            onChange={(e) => setTName(e.target.value)}
            placeholder="Customer name"
            className="input"
            required
            minLength={2}
          />
          <input
            value={tMessage}
            onChange={(e) => setTMessage(e.target.value)}
            placeholder="Testimonial message…"
            className="input"
            required
            minLength={5}
          />
          <div className="flex gap-2">
            <select value={tRating} onChange={(e) => setTRating(e.target.value)} className="input w-20 cursor-pointer" aria-label="Rating">
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>{r}★</option>
              ))}
            </select>
            <button type="submit" className="btn-rose shrink-0">Add</button>
          </div>
        </form>

        <div className="space-y-2">
          {testis.map((t) => (
            <div key={t.id} className="rounded-xl border border-plum/10 p-3">
              {editT?.id === t.id ? (
                <div className="grid gap-2">
                  <div className="grid gap-2 sm:grid-cols-[180px_1fr]">
                    <input className="input" value={editT.customerName} onChange={(e) => setEditT({ ...editT, customerName: e.target.value })} />
                    <input className="input" value={editT.message} onChange={(e) => setEditT({ ...editT, message: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEditTestimonial} className="btn-rose px-4 py-2 text-xs">
                      <Check className="h-3.5 w-3.5" /> Save
                    </button>
                    <button onClick={() => setEditT(null)} className="btn-outline px-4 py-2 text-xs">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <span className="flex shrink-0 gap-0.5 pt-0.5 text-gold">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
                    ))}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{t.customerName}</p>
                    <p className="line-clamp-2 text-sm text-plum/85">“{t.message}”</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <label className="flex cursor-pointer items-center gap-1 text-[10px] font-bold text-plumsoft">
                      <input
                        type="checkbox"
                        checked={t.isPublished}
                        onChange={async (e) => {
                          setTestis((l) => l.map((x) => (x.id === t.id ? { ...x, isPublished: e.target.checked } : x)));
                          await api("/api/admin/testimonials", "PATCH", { id: t.id, isPublished: e.target.checked });
                          router.refresh();
                        }}
                        className="h-3.5 w-3.5 accent-rose-600"
                      />
                      Live
                    </label>
                    <button onClick={() => setEditT(t)} aria-label="Edit" className="cursor-pointer rounded-lg bg-blush p-1.5 text-rosedeep transition hover:bg-blushdeep">
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={async () => {
                        setTestis((l) => l.filter((x) => x.id !== t.id));
                        await api("/api/admin/testimonials", "DELETE", { id: t.id });
                        router.refresh();
                      }}
                      aria-label="Delete"
                      className="cursor-pointer rounded-lg bg-red-50 p-1.5 text-red-500 transition hover:bg-red-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {testis.length === 0 && (
            <p className="py-6 text-center text-sm font-semibold text-plumsoft">
              No testimonials yet.
            </p>
          )}
        </div>
      </Section>
    </div>
  );
}
