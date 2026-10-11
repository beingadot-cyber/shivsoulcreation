import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductForm from "@/components/admin/ProductForm";

export const metadata: Metadata = { title: "Add Product" };

export default function NewProductPage() {
  return (
    <div>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-rose hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Products
      </Link>
      <h1 className="font-display mb-6 text-2xl font-semibold text-plum">Add Product</h1>
      <ProductForm
        initial={{
          productCode: "",
          name: "",
          price: "",
          mrp: "",
          description: "",
          category: "",
          imageUrl: null,
          stockQuantity: "10",
          isActive: true,
          isFeatured: false,
          isBestseller: false,
        }}
      />
    </div>
  );
}
