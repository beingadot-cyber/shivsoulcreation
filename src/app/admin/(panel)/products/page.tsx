import type { Metadata } from "next";
import { getAllProductsAdmin } from "@/lib/data";
import AdminProductsTable from "@/components/admin/AdminProductsTable";

export const metadata: Metadata = { title: "Manage Products" };

export default async function AdminProductsPage() {
  const products = await getAllProductsAdmin();
  return (
    <AdminProductsTable
      products={products.map((p) => ({
        id: p.id,
        productCode: p.productCode,
        name: p.name,
        price: p.price,
        mrp: p.mrp,
        imageUrl: p.imageUrl,
        category: p.category,
        stockQuantity: p.stockQuantity,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        isBestseller: p.isBestseller,
      }))}
    />
  );
}
