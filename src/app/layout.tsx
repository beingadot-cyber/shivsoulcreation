import type { Metadata, Viewport } from "next";
import { Fraunces, Quicksand } from "next/font/google";
import "./globals.css";
import { SITE_URL, SITE_NAME } from "@/lib/site";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fraunces",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-quicksand",
});

const DESCRIPTION =
  "Handcrafted torans, Shubh Labh hangings, diya thalis, tea light holders and festive gifting — made with love by Shiv Soul Creations. Pay securely with UPI, cards or net banking.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Shiv Soul Creations — Handcrafted Festive Décor & Gifting",
    template: "%s · Shiv Soul Creations",
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
    url: "/",
    title: "Shiv Soul Creations — Handcrafted Festive Décor & Gifting",
    description: DESCRIPTION,
    images: [{ url: "/brand/logo.png", alt: "Shiv Soul Creations logo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shiv Soul Creations — Handcrafted Festive Décor & Gifting",
    description: DESCRIPTION,
    images: ["/brand/logo.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fdf8f3",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${quicksand.variable}`}>
      <body>{children}</body>
    </html>
  );
}
