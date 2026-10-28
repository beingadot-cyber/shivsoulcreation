"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2, X } from "lucide-react";

const DONE_KEY = "ssc_mobile"; // saved once the visitor has submitted their number
const CLOSED_KEY = "ssc_popup_closed_at"; // when the visitor last pressed the cross
const COME_BACK_AFTER_MS = 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 2500;
const NOT_ON = ["/checkout", "/payment"];

/** Small "enter your mobile number" popup shown shortly after someone lands on the site. */
export default function MobilePopup() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const closedNow = useRef(false);

  // Decide once whether this visitor should see the popup at all.
  useEffect(() => {
    try {
      if (localStorage.getItem(DONE_KEY)) return;
      const closedAt = Number(localStorage.getItem(CLOSED_KEY) || 0);
      if (closedAt && Date.now() - closedAt < COME_BACK_AFTER_MS) return;
    } catch {
      return;
    }
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && !d.customer) setReady(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Open it a moment after the visitor lands on a page where it is allowed.
  useEffect(() => {
    if (!ready || open || closedNow.current) return;
    if (NOT_ON.some((p) => pathname.startsWith(p))) return;
    const t = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [ready, open, pathname]);

  function close() {
    closedNow.current = true;
    try {
      localStorage.setItem(CLOSED_KEY, String(Date.now()));
    } catch {}
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError("Please enter a valid mobile number.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/visitor/mobile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
      try {
        localStorage.setItem(DONE_KEY, mobile);
      } catch {}
      closedNow.current = true;
      setOpen(false);
    } catch {
      setError("Network error. Please try again.");
    }
    setBusy(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-plum/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Enter your mobile number"
        data-clarity-mask="True"
        className="relative w-full max-w-[300px] rounded-2xl bg-white p-5 pt-6 shadow-2xl"
        style={{ animation: "cart-bar-in 0.25s ease-out" }}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-2.5 right-2.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-plumsoft transition hover:bg-blush hover:text-rosedeep"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="text-center font-display text-xl font-semibold text-plum">Unlock Offers</h2>
        <form onSubmit={submit} className="mt-4">
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm font-semibold text-plumsoft">
              +91
            </span>
            <input
              className="input pl-12 font-mono tracking-wider"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="Mobile number"
              aria-label="Mobile number"
            />
          </div>
          {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className="btn-rose mt-3 w-full py-2.5">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
