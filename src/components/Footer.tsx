import type { ReactNode } from "react";
import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { InstagramIcon, WhatsAppIcon, FacebookIcon, YouTubeIcon } from "./icons";
import Logo from "./Logo";

export default function Footer({ settings }: { settings: Record<string, string> }) {
  const storeName = settings.store_name || "Shiv Soul Creations";
  const wa = settings.whatsapp_number ? `https://wa.me/${settings.whatsapp_number}` : null;

  const socials: { label: string; href: string; icon: ReactNode }[] = [];
  if (settings.instagram_url)
    socials.push({ label: "Instagram", href: settings.instagram_url, icon: <InstagramIcon className="h-4 w-4" /> });
  if (wa)
    socials.push({ label: "WhatsApp", href: wa, icon: <WhatsAppIcon className="h-4 w-4" /> });
  if (settings.facebook_url)
    socials.push({ label: "Facebook", href: settings.facebook_url, icon: <FacebookIcon className="h-4 w-4" /> });
  if (settings.youtube_url)
    socials.push({ label: "YouTube", href: settings.youtube_url, icon: <YouTubeIcon className="h-4 w-4" /> });

  return (
    <footer className="mt-12 border-t-2 border-gold/50 bg-plum text-cream/80">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-7 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-2 flex items-center gap-2.5">
            <Logo className="h-9" />
            <span className="font-display text-base font-semibold text-cream">{storeName}</span>
          </div>
          <p className="text-xs leading-relaxed text-cream/70">{settings.about}</p>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-bold tracking-[0.2em] text-blush uppercase">Shop</h3>
          <ul className="space-y-1 text-sm">
            <li><Link href="/" className="transition hover:text-cream">Home</Link></li>
            <li><Link href="/products" className="transition hover:text-cream">All Products</Link></li>
            <li><Link href="/products?category=Torans" className="transition hover:text-cream">Torans</Link></li>
            <li><Link href="/products?category=Shubh%20Labh" className="transition hover:text-cream">Shubh Labh</Link></li>
            <li><Link href="/cart" className="transition hover:text-cream">Cart</Link></li>
            <li><Link href="/account" className="transition hover:text-cream">My Account</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-bold tracking-[0.2em] text-blush uppercase">Contact</h3>
          <ul className="space-y-1 text-sm">
            {settings.contact_mobile && (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" /> +91 {settings.contact_mobile}
              </li>
            )}
            {settings.contact_email && (
              <li className="flex items-center gap-2 break-all">
                <Mail className="h-4 w-4 shrink-0" /> {settings.contact_email}
              </li>
            )}
            {settings.business_address && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {settings.business_address}
              </li>
            )}
            <li>
              <Link href="/support" className="underline-offset-2 transition hover:text-cream hover:underline">
                Customer Support
              </Link>
            </li>
          </ul>
          {socials.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-rose"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-xs font-bold tracking-[0.2em] text-blush uppercase">Policies</h3>
          <ul className="space-y-1 text-sm">
            <li><Link href="/policy/shipping" className="transition hover:text-cream">Shipping Policy</Link></li>
            <li><Link href="/policy/returns" className="transition hover:text-cream">Return Policy</Link></li>
            <li><Link href="/policy/privacy" className="transition hover:text-cream">Privacy Policy</Link></li>
            <li><Link href="/policy/terms" className="transition hover:text-cream">Terms &amp; Conditions</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-3 text-center text-[11px] text-cream/60">
        <p>© 2026 Shift Soul Creation</p>
        <p className="mt-0.5">
          Created with{" "}
          <a
            href="https://beingadot.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-blush underline-offset-2 hover:underline"
          >
            Being a Dot
          </a>
        </p>
      </div>
    </footer>
  );
}
