import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Flower2 } from "lucide-react";
import { getSession } from "@/lib/auth";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = { title: "Admin Login" };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session?.userType === "admin") redirect("/admin/dashboard");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-cream via-blush to-blushdeep px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-rose shadow-sm">
            <Flower2 className="h-7 w-7" strokeWidth={1.6} />
          </span>
          <h1 className="font-display text-2xl font-semibold text-plum">Admin Panel</h1>
          <p className="mt-1 text-sm font-semibold text-plumsoft">Shiv Soul Creations</p>
        </div>
        <AdminLoginForm />
        <p className="mt-6 text-center text-[11px] font-semibold text-plumsoft/70">
          Authorised access only · All activity is monitored
        </p>
      </div>
    </div>
  );
}
