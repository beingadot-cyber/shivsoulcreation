"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";
import ProductImage from "@/components/ProductImage";

export type ProductFormData = {
  id?: number;
  productCode: string;
  name: string;
  price: string;
  mrp: string;
  description: string;
  category: string;
  imageUrl: string | null;
  stockQuantity: string;
  isActive: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
};

export default function ProductForm({
  initial,
  isEdit,
}: {
  initial: ProductFormData;
  isEdit?: boolean;
}) {
  const router = useRouter();
  const [f, setF] = useState<ProductFormData>(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof ProductFormData>(k: K, v: ProductFormData[K]) =>
    setF((p) => ({ ...p, [k]: v }));

  async function uploadImage(file: File) {
    setError("");
    const okTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!okTypes.includes(file.type)) {
      setError("Only JPG, PNG or WebP images are allowed.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2 MB.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "product");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Upload failed.");
        return;
      }
      set("imageUrl", data.url);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const payload = {
      productCode: f.productCode.trim().toUpperCase(),
      name: f.name.trim(),
      price: Number(f.price),
      mrp: f.mrp ? Number(f.mrp) : null,
      description: f.description,
      category: f.category,
      imageUrl: f.imageUrl,
      stockQuantity: Number(f.stockQuantity || 0),
      isActive: f.isActive,
      isFeatured: f.isFeatured,
      isBestseller: f.isBestseller,
    };
    try {
      const res = await fetch(
        isEdit ? `/api/admin/products/${f.id}` : "/api/admin/products",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Could not save.");
        setSaving(false);
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="card h-fit space-y-4 p-5 sm:p-6">
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
            {error}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="pf-code">Product Code *</label>
            <input
              id="pf-code"
              className="input font-mono"
              value={f.productCode}
              onChange={(e) => set("productCode", e.target.value.toUpperCase())}
              placeholder="SSC-016"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="pf-cat">Category</label>
            <input
              id="pf-cat"
              className="input"
              value={f.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="e.g. Torans"
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="pf-name">Product Name *</label>
          <input
            id="pf-name"
            className="input"
            value={f.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Product name"
            required
            minLength={3}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="pf-price">Selling Price (₹) *</label>
            <input
              id="pf-price"
              className="input"
              type="number"
              min={1}
              step={1}
              value={f.price}
              onChange={(e) => set("price", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="pf-mrp">MRP (₹, optional)</label>
            <input
              id="pf-mrp"
              className="input"
              type="number"
              min={0}
              step={1}
              value={f.mrp}
              onChange={(e) => set("mrp", e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="pf-stock">Stock Quantity *</label>
            <input
              id="pf-stock"
              className="input"
              type="number"
              min={0}
              step={1}
              value={f.stockQuantity}
              onChange={(e) => set("stockQuantity", e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="pf-desc">Description</label>
          <textarea
            id="pf-desc"
            className="input min-h-28 resize-y"
            value={f.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Describe the product — materials, size, occasion…"
          />
        </div>
        <div className="flex flex-wrap gap-5 border-t border-plum/10 pt-4">
          <Check label="Published (visible on website)" checked={f.isActive} onChange={(v) => set("isActive", v)} />
          <Check label="Featured product" checked={f.isFeatured} onChange={(v) => set("isFeatured", v)} />
          <Check label="Bestseller" checked={f.isBestseller} onChange={(v) => set("isBestseller", v)} />
        </div>
      </div>

      <div className="card h-fit p-5 sm:p-6">
        <label className="label">Product Image (square, max 2 MB)</label>
        <div className="overflow-hidden rounded-xl border border-plum/10">
          {uploading ? (
            <div className="flex aspect-square items-center justify-center bg-blush/50">
              <Loader2 className="h-6 w-6 animate-spin text-rose" />
            </div>
          ) : (
            <ProductImage src={f.imageUrl} alt={f.name || "Product"} code={f.productCode} />
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadImage(file);
          }}
        />
        <div className="mt-3 grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="btn-outline w-full"
          >
            {f.imageUrl ? (
              <>
                <RefreshCw className="h-4 w-4" /> Replace Image
              </>
            ) : (
              <>
                <ImagePlus className="h-4 w-4" /> Upload Image
              </>
            )}
          </button>
          {f.imageUrl && (
            <button
              type="button"
              onClick={() => set("imageUrl", null)}
              className="btn-outline w-full border-red-200 text-red-500 hover:border-red-300 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" /> Remove Image
            </button>
          )}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed font-semibold text-plumsoft">
          Use a square (1:1) JPG, PNG or WebP image, ideally 1000×1000 px. Max 2 MB.
        </p>

        <button type="submit" disabled={saving || uploading} className="btn-dark mt-5 w-full py-3">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : isEdit ? (
            "Save Changes"
          ) : (
            "Create Product"
          )}
        </button>
      </div>
    </form>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm font-bold text-plum">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-rose-600"
      />
      {label}
    </label>
  );
}
