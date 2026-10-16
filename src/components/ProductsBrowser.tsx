"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import ProductCard, { type CardProduct } from "./ProductCard";

type SortKey = "default" | "price-asc" | "price-desc" | "name";

export default function ProductsBrowser({
  products,
  initialQuery = "",
  initialCategory = "",
}: {
  products: CardProduct[];
  initialQuery?: string;
  initialCategory?: string;
}) {
  const [q, setQ] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState<SortKey>("default");
  const [inStockOnly, setInStockOnly] = useState(false);

  const categories = useMemo(
    () =>
      Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort() as string[],
    [products]
  );

  const filtered = useMemo(() => {
    let list = [...products];
    const needle = q.trim().toLowerCase();
    if (needle) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.productCode.toLowerCase().includes(needle) ||
          (p.category || "").toLowerCase().includes(needle)
      );
    }
    if (category) list = list.filter((p) => p.category === category);
    if (inStockOnly) list = list.filter((p) => p.stockQuantity > 0);
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, q, category, sort, inStockOnly]);

  const hasFilters = q.trim() || category || inStockOnly || sort !== "default";

  return (
    <div>
      {/* Controls */}
      <div className="card mb-6 flex flex-col gap-3 p-3.5 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 text-plumsoft" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or product code…"
              className="input py-2.5 pl-10"
              aria-label="Search products"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <SlidersHorizontal className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-plumsoft" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="input cursor-pointer appearance-none py-2.5 pr-8 pl-9 text-[13px] font-semibold"
                aria-label="Sort products"
              >
                <option value="default">Sort: Default</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-[13px] font-bold whitespace-nowrap text-plum">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="h-4 w-4 accent-rose-600"
              />
              In stock
            </label>
          </div>
        </div>
        {categories.length > 0 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
            <button
              onClick={() => setCategory("")}
              className={`shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                category === "" ? "bg-plum text-white" : "bg-blush text-rosedeep hover:bg-blushdeep"
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(category === c ? "" : c)}
                className={`shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  category === c ? "bg-plum text-white" : "bg-blush text-rosedeep hover:bg-blushdeep"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <p className="font-display text-lg font-semibold text-plum">No products found</p>
          <p className="text-sm text-plumsoft">Try a different search or clear the filters.</p>
          {hasFilters && (
            <button
              onClick={() => {
                setQ("");
                setCategory("");
                setSort("default");
                setInStockOnly(false);
              }}
              className="btn-outline"
            >
              <X className="h-4 w-4" /> Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs font-bold tracking-wider text-plumsoft uppercase">
            {filtered.length} {filtered.length === 1 ? "product" : "products"}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.productCode} product={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
