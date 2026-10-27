"use client";

import { useState } from "react";
import { MessageCircle, Trash2 } from "lucide-react";
import { formatDateTime, formatINR } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";

type Row = {
  id: number;
  mobile: string;
  name: string;
  itemsText: string;
  cartTotal: number;
  contacted: boolean;
  updatedAt: string;
};

export default function AbandonedTable({ rows: initial }: { rows: Row[] }) {
  const [rows, setRows] = useState(initial);

  async function toggle(r: Row) {
    setRows((l) => l.map((x) => (x.id === r.id ? { ...x, contacted: !r.contacted } : x)));
    await fetch(`/api/admin/abandoned/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contacted: !r.contacted }),
    });
  }

  async function remove(r: Row) {
    if (!window.confirm(`Remove +91 ${r.mobile} from this list?`)) return;
    setRows((l) => l.filter((x) => x.id !== r.id));
    await fetch(`/api/admin/abandoned/${r.id}`, { method: "DELETE" });
  }

  const message = (r: Row) =>
    `Hi ${r.name ? r.name.split(" ")[0] : "there"}! This is Shiv Soul Creations. We saw you were checking out ${r.itemsText} on our website. Can I help you complete your order, or answer any questions?`;

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-semibold text-plum">Abandoned Checkouts</h1>
      <p className="mb-5 max-w-2xl text-sm font-semibold text-plumsoft">
        People who typed their mobile number on the checkout page but have not placed an order. Message them on
        WhatsApp to help them finish. They leave this list automatically when they order.
      </p>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-blush/40">
              <tr>
                <th className="admin-th">Customer</th>
                <th className="admin-th">Cart</th>
                <th className="admin-th">Value</th>
                <th className="admin-th">Last active</th>
                <th className="admin-th">Contacted</th>
                <th className="admin-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-plum/5">
              {rows.map((r) => {
                const wa = waLink(r.mobile, message(r));
                return (
                  <tr key={r.id}>
                    <td className="admin-td">
                      <p className="font-bold">{r.name || "—"}</p>
                      <p className="text-xs text-plumsoft">+91 {r.mobile}</p>
                    </td>
                    <td className="admin-td max-w-xs text-xs text-plum/80">{r.itemsText}</td>
                    <td className="admin-td font-bold whitespace-nowrap">{formatINR(r.cartTotal)}</td>
                    <td className="admin-td text-plumsoft whitespace-nowrap">{formatDateTime(r.updatedAt)}</td>
                    <td className="admin-td">
                      <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-plumsoft">
                        <input type="checkbox" checked={r.contacted} onChange={() => toggle(r)} className="h-4 w-4 accent-rose" />
                        {r.contacted ? "Done" : "Not yet"}
                      </label>
                    </td>
                    <td className="admin-td">
                      <div className="flex items-center justify-end gap-1.5">
                        {wa && (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => !r.contacted && toggle(r)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-sage/15 px-3 py-1.5 text-xs font-bold text-sage transition hover:bg-sage/25"
                          >
                            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                          </a>
                        )}
                        <button
                          onClick={() => remove(r)}
                          aria-label="Remove"
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-blush text-rosedeep transition hover:bg-blushdeep"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="admin-td py-10 text-center text-plumsoft">
                    No abandoned checkouts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
