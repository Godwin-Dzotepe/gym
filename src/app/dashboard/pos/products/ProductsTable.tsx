"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { useFormatCurrency } from "@/components/providers/CurrencyProvider";
import { Package, Pencil, Trash2, X, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";

interface Product {
  id: string; name: string; description: string; price: number;
  stock: number; category: string; isActive: boolean; createdAt: string;
}
interface Category { id: string; name: string; }

export default function ProductsTable({
  products: initial, categories,
}: { products: Product[]; categories: Category[] }) {
  const formatCurrency = useFormatCurrency();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [products, setProducts] = useState(initial);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  function openEdit(p: Product) {
    setEditProduct({ ...p });
  }

  function setField(k: keyof Product, v: any) {
    setEditProduct((prev) => prev ? { ...prev, [k]: v } : prev);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editProduct) return;
    setSaving(true);
    const res = await fetch(`/api/products/${editProduct.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editProduct.name,
        description: editProduct.description,
        price: editProduct.price,
        stock: editProduct.stock,
        category: editProduct.category,
        isActive: editProduct.isActive,
      }),
    });
    setSaving(false);
    if (!res.ok) { toast.error("Failed to update product."); return; }
    const updated = await res.json();
    setProducts((prev) => prev.map((p) => p.id === updated.id ? {
      ...updated, price: Number(updated.price), createdAt: updated.createdAt,
    } : p));
    setEditProduct(null);
    toast.success("Product updated successfully.");
    router.refresh();
  }

  async function deleteProduct(p: Product) {
    const ok = await confirm({
      title: "Delete Product?",
      message: `"${p.name}" will be marked inactive and removed from the store.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    await fetch(`/api/products/${p.id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((x) => x.id !== p.id));
    toast.success("Product deleted.");
    router.refresh();
  }

  return (
    <>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="table-th">Product</th>
                <th className="table-th">Category</th>
                <th className="table-th">Price</th>
                <th className="table-th">Stock</th>
                <th className="table-th">Status</th>
                <th className="table-th">Added</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-td text-center py-16">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">No products yet</p>
                    <Link href="/dashboard/pos/products/new" className="btn-primary text-sm mt-3 inline-flex">
                      Add First Product
                    </Link>
                  </td>
                </tr>
              ) : products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{p.name}</p>
                        {p.description && <p className="text-xs text-slate-400 truncate max-w-48">{p.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="table-td text-slate-500 text-sm">{p.category || "—"}</td>
                  <td className="table-td font-semibold text-slate-800">{formatCurrency(p.price)}</td>
                  <td className="table-td">
                    <span className={`text-sm font-medium ${p.stock <= 0 ? "text-red-500" : p.stock <= 5 ? "text-yellow-600" : "text-slate-700"}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="table-td">
                    <span className={`badge ${p.isActive ? "badge-green" : "badge-gray"}`}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="table-td text-slate-400 text-sm">{formatDate(p.createdAt)}</td>
                  <td className="table-td">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEdit(p)}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-medium transition-colors"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => deleteProduct(p)}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editProduct && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Edit Product</h2>
              <button onClick={() => setEditProduct(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveEdit} className="px-6 py-5 space-y-4">
              <div className="form-group">
                <label className="label label-required">Product Name</label>
                <input className="input" required value={editProduct.name}
                  onChange={(e) => setField("name", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <textarea className="input resize-none" rows={2} value={editProduct.description}
                  onChange={(e) => setField("description", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label label-required">Price</label>
                  <input type="number" step="0.01" min="0" className="input" required
                    value={editProduct.price} onChange={(e) => setField("price", parseFloat(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="label">Stock</label>
                  <input type="number" min="0" className="input"
                    value={editProduct.stock} onChange={(e) => setField("stock", parseInt(e.target.value))} />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Category</label>
                <select className="select" value={editProduct.category}
                  onChange={(e) => setField("category", e.target.value)}>
                  <option value="">No category</option>
                  {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Status</label>
                <select className="select" value={editProduct.isActive ? "active" : "inactive"}
                  onChange={(e) => setField("isActive", e.target.value === "active")}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={() => setEditProduct(null)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
