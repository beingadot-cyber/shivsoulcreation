import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone, Headset } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Support" };

export default async function SupportPage() {
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-16">
      <p className="mb-1 text-xs font-bold tracking-[0.2em] text-rose uppercase">We&apos;re here to help</p>
      <h1 className="section-title mb-6">Customer Support</h1>

      <div className="card mb-6 flex items-start gap-4 p-6">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blush text-rose">
          <Headset className="h-6 w-6" strokeWidth={1.6} />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-plum">Questions about an order or product?</h2>
          <p className="mt-1 text-sm leading-relaxed text-plumsoft">
            Reach out on WhatsApp for the fastest response — share your order ID if you have one.
            You can also connect with us on Instagram for custom festive orders and gifting.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {s.whatsapp_number && (
          <a
            href={`https://wa.me/${s.whatsapp_number}`}
            target="_blank"
            rel="noreferrer"
            className="card flex items-center gap-3 p-5 transition hover:border-rose/40 hover:shadow-md"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage/15 text-sage">
              <WhatsAppIcon className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-bold text-plum">WhatsApp</span>
              <span className="block text-xs font-semibold text-plumsoft">Chat with us</span>
            </span>
          </a>
        )}
        {s.instagram_url && (
          <a
            href={s.instagram_url}
            target="_blank"
            rel="noreferrer"
            className="card flex items-center gap-3 p-5 transition hover:border-rose/40 hover:shadow-md"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blush text-rose">
              <InstagramIcon className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-bold text-plum">Instagram</span>
              <span className="block text-xs font-semibold text-plumsoft">Follow our latest work</span>
            </span>
          </a>
        )}
        {s.contact_mobile && (
          <div className="card flex items-center gap-3 p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blush text-rose">
              <Phone className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-bold text-plum">Call</span>
              <span className="block text-xs font-semibold text-plumsoft">+91 {s.contact_mobile}</span>
            </span>
          </div>
        )}
        {s.contact_email && (
          <a
            href={`mailto:${s.contact_email}`}
            className="card flex items-center gap-3 p-5 transition hover:border-rose/40 hover:shadow-md"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blush text-rose">
              <Mail className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-bold text-plum">Email</span>
              <span className="block text-xs font-semibold break-all text-plumsoft">{s.contact_email}</span>
            </span>
          </a>
        )}
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-bold tracking-wider text-plumsoft uppercase">Helpful policies</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/policy/shipping" className="card p-4 text-sm font-bold text-rosedeep transition hover:border-rose/40">Shipping Policy</Link>
          <Link href="/policy/returns" className="card p-4 text-sm font-bold text-rosedeep transition hover:border-rose/40">Return Policy</Link>
          <Link href="/policy/privacy" className="card p-4 text-sm font-bold text-rosedeep transition hover:border-rose/40">Privacy Policy</Link>
          <Link href="/policy/terms" className="card p-4 text-sm font-bold text-rosedeep transition hover:border-rose/40">Terms &amp; Conditions</Link>
        </div>
      </div>
    </div>
  );
}
