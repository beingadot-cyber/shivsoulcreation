import type { Metadata, Viewport } from "next";
import { Fraunces, Quicksand } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: {
    default: "Shiv Soul Creations — Handcrafted Festive Décor & Gifting",
    template: "%s · Shiv Soul Creations",
  },
  description:
    "Handcrafted torans, Shubh Labh hangings, diya thalis, tea light holders and festive gifting — made with love by Shiv Soul Creations.",
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
