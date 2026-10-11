"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShoppingBag, User, Menu, X } from "lucide-react";
import AuthModal, { SESSION_EVENT } from "./AuthModal";
import Logo from "./Logo";
import { useCart, cartCount } from "@/store/cart";

export default function Header({ settings }: { settings: Record<string, string> }) {
  const router = useRouter();
  const [me, setMe] = useState<{ mobileNumber: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState("");
  const [mounted, setMounted] = useState(false);
  const items = useCart((s) => s.items);
  const count = mounted ? cartCount(items) : 0;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setMe(data.customer);
      } catch {
        /* ignore */
      }
    };
    load();
    const onSession = () => load();
    window.addEventListener(SESSION_EVENT, onSession);
    return () => {
      cancelled = true;
      window.removeEventListener(SESSION_EVENT, onSession);
    };
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setMenuOpen(false);
    router.push(q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : "/products");
  }

  return (
    <header className="sticky top-0 z-40">
      {settings.announcement && (
        <div className="bg-plum px-4 py-1.5 text-center text-[11px] font-semibold tracking-wide text-cream/90">
          {settings.announcement}
        </div>
      )}
      <div className="border-b border-plum/10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <Logo className="h-10" />
            <span className="leading-tight">
              <span className="block font-display text-base font-semibold text-plum sm:text-lg">
                Shiv Soul
              </span>
              <span className="block text-[10px] font-bold tracking-[0.22em] text-rose uppercase">
                Creations
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="ml-6 hidden items-center gap-6 text-sm font-bold text-plum md:flex">
            <Link href="/" className="transition hover:text-rose">Home</Link>
            <Link href="/products" className="transition hover:text-rose">Products</Link>
            <Link href="/support" className="transition hover:text-rose">Support</Link>
          </nav>

          {/* Desktop search */}
          <form onSubmit={submitSearch} className="ml-auto hidden max-w-xs flex-1 md:block">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 text-plumsoft" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search décor, torans, gifts…"
                className="input rounded-full py-2 pl-10 text-[13px]"
                aria-label="Search products"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1.5 md:ml-2">
            {me && (
              <Link
                href="/account"
                className="hidden items-center gap-2 rounded-full bg-blush px-4 py-2 text-sm font-bold text-rosedeep transition hover:bg-blushdeep sm:inline-flex"
              >
                <User className="h-4 w-4" /> My Account
              </Link>
            )}

            <Link
              href="/cart"
              aria-label="Cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-blush text-rosedeep transition hover:bg-blushdeep"
            >
              <ShoppingBag className="h-5 w-5" strokeWidth={1.8} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose px-1 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-plum transition hover:bg-blush md:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-plum/10 bg-cream px-4 pt-3 pb-4 md:hidden">
            <form onSubmit={submitSearch} className="relative mb-3">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 text-plumsoft" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products…"
                className="input py-2 pl-10 text-sm"
              />
            </form>
            <nav className="flex flex-col gap-1 text-sm font-bold text-plum">
              <Link href="/" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-2.5 hover:bg-blush">Home</Link>
              <Link href="/products" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-2.5 hover:bg-blush">Products</Link>
              <Link href="/support" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-2.5 hover:bg-blush">Support</Link>
              {me && (
                <Link href="/account" onClick={() => setMenuOpen(false)} className="rounded-xl bg-blush px-3 py-2.5 text-rosedeep">
                  My Account (+91 {me.mobileNumber})
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
      <AuthModal
        onSuccess={() => {
          fetch("/api/auth/me", { cache: "no-store" })
            .then((r) => r.json())
            .then((d) => setMe(d.customer))
            .catch(() => {});
        }}
      />
    </header>
  );
}
