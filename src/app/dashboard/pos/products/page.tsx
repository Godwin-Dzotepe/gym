import { prisma } from "@/lib/prisma";
import { getGymCurrency } from "@/lib/currency";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Plus } from "lucide-react";
import ProductsTable from "./ProductsTable";

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.productCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your POS inventory</p>
        </div>
        <Link href="/dashboard/pos/products/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      <ProductsTable
        products={products.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description ?? "",
          price: Number(p.price),
          stock: p.stock,
          category: p.category ?? "",
          isActive: p.isActive,
          createdAt: p.createdAt.toISOString(),
        }))}
        categories={categories.map(c => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
