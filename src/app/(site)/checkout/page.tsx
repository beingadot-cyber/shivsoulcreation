import { Suspense } from "react";
import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import CheckoutClient from "@/components/CheckoutClient";

export const metadata: Metadata = { title: "Checkout" };

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
      <CheckoutClient
        settings={{
          upi_id: s.upi_id || "",
          upi_name: s.upi_name || "Shiv Soul Creations",
          whatsapp_number: s.whatsapp_number || "",
          store_name: s.store_name || "Shiv Soul Creations",
        }}
      />
    </Suspense>
  );
}
