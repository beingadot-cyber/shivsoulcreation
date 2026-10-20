"use client";

import { useEffect } from "react";
import { pixelTrack } from "@/lib/pixel";

/** Fires a Meta "ViewContent" event once when a product page is opened. */
export default function ViewContentTracker({
  code,
  name,
  price,
}: {
  code: string;
  name: string;
  price: number;
}) {
  useEffect(() => {
    pixelTrack("ViewContent", {
      content_ids: [code],
      content_name: name,
      content_type: "product",
      value: price,
      currency: "INR",
    });
  }, [code, name, price]);
  return null;
}
