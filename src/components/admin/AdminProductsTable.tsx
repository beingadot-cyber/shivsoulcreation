"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Search, Trash2, Star, Sparkles } from "lucide-react";
import { formatINR } from "@/lib/format";
import ProductImage from "@/components/ProductImage";

type Row = {
  id: number;
  productCode: string;
  name: string;
  price: number;
  mrp: number | null;
  imageUrl: string | null;
  category: string | null;
  stockQuantity: number;
  isActive: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
};

export default function AdminProductsTable({ products: initial }: { products: Row[] }) {
  const router = useRouter();
  const [products, setProducts] = useState(initial);
  const [q, setQ] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(n) || p.productCode.toLowerCase().includes(n)
    );
  }, [products, q]);

  async function toggle(p: Row, field: "isActive" | "isFeatured" | "isBestseller") {
    setBusy(p.id);
    setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, [field]: !x[field] } : x)));
    await fetch(`/api/admin/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !p[field] }),
    });
    setBusy(null);
    router.refresh();
  }

  async function archive(p: Row) {
    setBusy(p.id);
    await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
    setProducts((list) => list.filter((x) => x.id !== p.id));
    setBusy(null);
    setConfirmId(null);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-plum">Products</h1>
        <Link href="/admin/products/new" className="btn-rose">
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-plum/10 p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 text-plumsoft" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products…"
              className="input py-2 pl-10"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="bg-blush/40">
              <tr>
                <th className="admin-th">Product</th>
                <th className="admin-th">Price</th>
                <th className="admin-th">Stock</th>
                <th className="admin-th text-center">Published</th>
                <th className="admin-th text-center">Featured</th>
                <th className="admin-th text-center">Bestseller</th>
                <th className="admin-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-plum/5">
              {filtered.map((p) => (
                <tr key={p.id} className="transition hover:bg-blush/20">
                  <td className="admin-td">
                    <div className="flex items-center gap-3">
                      <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-plum/10">
                        <ProductImage src={p.imageUrl} alt={p.name} code={p.productCode} />
                      </span>
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-bold">{p.name}</p>
                        <p className="text-xs font-semibold text-plumsoft">
                          {p.productCode}
                          {p.category ? ` · ${p.category}` : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="admin-td font-bold whitespace-nowrap">{formatINR(p.price)}</td>
                  <td className="admin-td">
                    <span className={`font-bold ${p.stockQuantity <= 0 ? "text-red-500" : p.stockQuantity <= 5 ? "text-amber-600" : ""}`}>
                      {p.stockQuantity}
                    </span>
                  </td>
                  <td className="admin-td text-center">
                    <Toggle on={p.isActive} disabled={busy === p.id} onClick={() => toggle(p, "isActive")} label="Published" />
                  </td>
                  <td className="admin-td text-center">
                    <Toggle on={p.isFeatured} disabled={busy === p.id} onClick={() => toggle(p, "isFeatured")} label="Featured" icon={<Sparkles className="h-3 w-3" />} />
                  </td>
                  <td className="admin-td text-center">
                    <Toggle on={p.isBestseller} disabled={busy === p.id} onClick={() => toggle(p, "isBestseller")} label="Bestseller" icon={<Star className="h-3 w-3" />} />
                  </td>
                  <td className="admin-td">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-blush text-rosedeep transition hover:bg-blushdeep"
                        aria-label={`Edit ${p.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      {confirmId === p.id ? (
                        <span className="flex items-center gap-1.5">
                          <button
                            onClick={() => archive(p)}
                            className="cursor-pointer rounded-lg bg-red-500 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-red-600"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="cursor-pointer rounded-lg bg-plum/10 px-2.5 py-1.5 text-[11px] font-bold text-plum"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmId(p.id)}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-red-50 text-red-500 transition hover:bg-red-100"
                          aria-label={`Delete ${p.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="admin-td py-10 text-center text-plumsoft">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-plum/10 px-4 py-2.5 text-[11px] font-semibold text-plumsoft">
          Deleting archives the product so past orders stay intact.
        </p>
      </div>
    </div>
  );
}

function Toggle({
  on,
  onClick,
  disabled,
  label,
  icon,
}: {
  on: boolean;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
        on ? "bg-plum text-white" : "bg-plum/10 text-plumsoft hover:bg-plum/20"
      } disabled:opacity-50`}
    >
      {icon}
      {on ? "Yes" : "No"}
    </button>
  );
}
