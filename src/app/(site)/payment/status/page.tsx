import { Suspense } from "react";
import type { Metadata } from "next";
import PaymentStatusClient from "@/components/PaymentStatusClient";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { robots: { index: false, follow: false }, title: "Payment Status" };

export default async function PaymentStatusPage() {
  const s = await getSettings();
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-xl px-4 pt-16 text-center text-sm font-semibold text-plumsoft">
          Checking your payment…
        </div>
      }
    >
      <PaymentStatusClient whatsapp={s.whatsapp_number || ""} />
    </Suspense>
  );
}
