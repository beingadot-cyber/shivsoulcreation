import { requireAdmin } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  return (
    <AdminShell username={session.userType === "admin" ? session.admin.username : "admin"}>
      {children}
    </AdminShell>
  );
}
