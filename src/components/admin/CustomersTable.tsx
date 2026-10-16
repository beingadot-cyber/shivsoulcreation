"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Search, ShieldCheck, ShieldOff, ClipboardList } from "lucide-react";
import { formatDate } from "@/lib/format";

type Row = {
  id: number;
  mobileNumber: string;
  mobileVerified: boolean;
  accountStatus: string;
  createdAt: string;
  lastLogin: string | null;
  orderCount: number;
};

export default function CustomersTable({ customers: initial }: { customers: Row[] }) {
  const router = useRouter();
  const [customers, setCustomers] = useState(initial);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return customers;
    return customers.filter((c) => c.mobileNumber.includes(n) || String(c.id).includes(n));
  }, [customers, q]);

  async function act(id: number, action: "enable" | "disable" | "set-password") {
    let newPassword = "";
    if (action === "set-password") {
      newPassword = window.prompt("Enter a new password for this customer (min 8 chars, letters + numbers):") || "";
      if (!newPassword) return;
    }
    setBusy(id);
    setNotice("");
    const res = await fetch(`/api/admin/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, newPassword }),
    });
    const data = await res.json();
    setBusy(null);
    if (data.error) {
      setNotice(data.error);
      return;
    }
    if (action === "enable" || action === "disable") {
      setCustomers((list) =>
        list.map((c) =>
          c.id === id ? { ...c, accountStatus: action === "enable" ? "active" : "disabled" } : c
        )
      );
      router.refresh();
    } else if (action === "set-password") {
      setNotice(`Password updated for +91 ${data.mobile}. Share the new password with the customer.`);
    }
  }

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl font-semibold text-plum">Registered Customers</h1>

      {notice && (
        <div className="mb-4 rounded-xl border border-gold/30 bg-amber-50 px-4 py-3 text-xs font-semibold break-words text-amber-800">
          {notice}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="border-b border-plum/10 p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 text-plumsoft" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by mobile number…"
              inputMode="numeric"
              className="input py-2 pl-10"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-blush/40">
              <tr>
                <th className="admin-th">ID</th>
                <th className="admin-th">Mobile Number</th>
                <th className="admin-th">Verification</th>
                <th className="admin-th">Registered</th>
                <th className="admin-th">Last Login</th>
                <th className="admin-th">Status</th>
                <th className="admin-th text-center">Orders</th>
                <th className="admin-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-plum/5">
              {filtered.map((c) => (
                <tr key={c.id} className="transition hover:bg-blush/20">
                  <td className="admin-td font-mono font-bold">#{c.id}</td>
                  <td className="admin-td font-mono font-bold">+91 {c.mobileNumber}</td>
                  <td className="admin-td">
                    {c.mobileVerified ? (
                      <span className="chip bg-sage/15 text-sage">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </span>
                    ) : (
                      <span className="chip bg-amber-50 text-amber-700">Pending</span>
                    )}
                  </td>
                  <td className="admin-td text-plumsoft">{formatDate(c.createdAt)}</td>
                  <td className="admin-td text-plumsoft">{c.lastLogin ? formatDate(c.lastLogin) : "—"}</td>
                  <td className="admin-td">
                    <span className={`chip ${c.accountStatus === "active" ? "bg-sage/15 text-sage" : "bg-red-50 text-red-500"}`}>
                      {c.accountStatus === "active" ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="admin-td text-center font-bold">{c.orderCount}</td>
                  <td className="admin-td">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/orders?q=${c.mobileNumber}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-blush text-rosedeep transition hover:bg-blushdeep"
                        title="View orders"
                      >
                        <ClipboardList className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => act(c.id, c.accountStatus === "active" ? "disable" : "enable")}
                        disabled={busy === c.id}
                        className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition disabled:opacity-50 ${
                          c.accountStatus === "active"
                            ? "bg-red-50 text-red-500 hover:bg-red-100"
                            : "bg-sage/15 text-sage hover:bg-sage/25"
                        }`}
                        title={c.accountStatus === "active" ? "Disable account" : "Enable account"}
                      >
                        <ShieldOff className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => act(c.id, "set-password")}
                        disabled={busy === c.id}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-amber-50 text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                        title="Set a new password for this customer"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="admin-td py-10 text-center text-plumsoft">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-plum/10 px-4 py-2.5 text-[11px] font-semibold text-plumsoft">
          Passwords are securely hashed — they can never be viewed or recovered, only replaced with a new one.
        </p>
      </div>
    </div>
  );
}
