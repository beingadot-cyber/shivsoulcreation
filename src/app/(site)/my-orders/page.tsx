import type { Metadata } from "next";
import MyOrdersClient from "@/components/MyOrdersClient";

export const metadata: Metadata = { robots: { index: false, follow: false }, title: "My Orders" };

export default function MyOrdersPage() {
  return <MyOrdersClient />;
}
