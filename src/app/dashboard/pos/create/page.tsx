import { prisma } from "@/lib/prisma";
import POSCreateSale from "@/components/pos/POSCreateSale";

export default async function CreateSalePage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.productCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  const productCategories = [...new Set(products.map(p => p.category).filter(Boolean))] as string[];
  const allCategories = [...new Set([...categories.map(c => c.name), ...productCategories])];

  return (
    <POSCreateSale
      products={products.map(p => ({
        id: p.id, name: p.name, price: Number(p.price), stock: p.stock, category: p.category ?? "Other",
      }))}
      categories={allCategories}
    />
  );
}
