import { Suspense } from "react";
import type { Metadata } from "next";
import PaymentStatusClient from "@/components/PaymentStatusClient";

export const metadata: Metadata = { title: "Payment Status" };

export default function PaymentStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-xl px-4 pt-16 text-center text-sm font-semibold text-plumsoft">
          Checking your payment…
        </div>
      }
    >
      <PaymentStatusClient />
    </Suspense>
  );
}
