import { Suspense } from "react";
import type { Metadata } from "next";
import CheckoutClient from "@/components/CheckoutClient";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { robots: { index: false, follow: false }, title: "Checkout" };

export default async function CheckoutPage() {
  const s = await getSettings();
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 pt-16 text-center text-sm font-semibold text-plumsoft">
          Loading checkout…
        </div>
      }
    >
      <CheckoutClient whatsapp={s.whatsapp_number || ""} />
    </Suspense>
  );
}
