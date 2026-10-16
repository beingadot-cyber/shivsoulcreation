"use client";

import { useState } from "react";
import { Flower2 } from "lucide-react";

/**
 * Brand logo. Loads /brand/logo.png from the public folder.
 * Falls back to the existing icon if the file is missing, so the header
 * never shows a broken image before the real logo is uploaded.
 */
export default function Logo({ className = "h-10" }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={`flex aspect-square items-center justify-center rounded-xl bg-blush text-rose ${className}`}
      >
        <Flower2 className="h-1/2 w-1/2" strokeWidth={1.7} />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/logo.png"
      alt="Shiv Soul Creations logo"
      className={`w-auto object-contain ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
