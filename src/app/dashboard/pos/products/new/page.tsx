"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, Check, X, Tag } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";

interface Category { id: string; name: string; }

export default function NewProductPage() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const [form, setForm] = useState({ name: "", description: "", price: "", stock: "0", categoryId: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => { loadCategories(); }, []);

  async function loadCategories() {
    const res = await fetch("/api/categories");
    setCategories(await res.json());
  }

  async function addCategory() {
    if (!newCatName.trim()) return;
    setAddingCat(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName.trim() }),
    });
    setAddingCat(false);
    if (!res.ok) { toast.error((await res.json()).error ?? "Failed"); return; }
    const cat = await res.json();
    setCategories((prev) => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
    setNewCatName("");
    toast.success(`Category "${cat.name}" added.`);
  }

  async function saveEdit(id: string) {
    if (!editingName.trim()) return;
    const res = await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingName.trim() }),
    });
    if (!res.ok) { toast.error((await res.json()).error ?? "Failed"); return; }
    const updated = await res.json();
    setCategories((prev) => prev.map((c) => c.id === id ? updated : c).sort((a, b) => a.name.localeCompare(b.name)));
    setEditingId(null);
    toast.success("Category updated.");
  }

  async function deleteCategory(cat: Category) {
    const ok = await confirm({ title: "Delete Category?", message: `"${cat.name}" will be removed. Products using it won't be deleted.`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    if (form.categoryId === cat.id) set("categoryId", "");
    toast.success("Category deleted.");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const payload = {
      ...form,
      category: categories.find((c) => c.id === form.categoryId)?.name ?? "",
      categoryId: form.categoryId || undefined,
    };
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) { setError((await res.json()).error ?? "Failed"); setLoading(false); return; }
    toast.success("Product added successfully.");
    router.push("/dashboard/pos/products");
  }

  return (
    <div className="space-y-5">
      <Link href="/dashboard/pos/products" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-3.5 h-3.5" /> Products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        {/* ── Add Product Form ── */}
        <div className="lg:col-span-2 card p-6">
          <h1 className="page-title mb-6">Add Product</h1>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <form onSubmit={submit} className="space-y-4">
            <div className="form-group">
              <label className="label label-required">Product Name</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} className="input" placeholder="e.g. Protein Shake" required />
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className="input resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label label-required">Price</label>
                <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} className="input" placeholder="0.00" required />
              </div>
              <div className="form-group">
                <label className="label">Stock</label>
                <input type="number" min="0" value={form.stock} onChange={(e) => set("stock", e.target.value)} className="input" />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Category</label>
              <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} className="select">
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn-primary">{loading ? "Adding..." : "Add Product"}</button>
              <Link href="/dashboard/pos/products" className="btn-secondary">Cancel</Link>
            </div>
          </form>
        </div>

        {/* ── Category Manager ── */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-500" />
            <h2 className="font-semibold text-gray-900">Categories</h2>
            <span className="ml-auto text-xs bg-gray-100 text-gray-500 font-medium px-2 py-0.5 rounded-full">{categories.length}</span>
          </div>

          {/* Category list */}
          <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
            {categories.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No categories yet</p>
            ) : categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 group">
                {editingId === cat.id ? (
                  <>
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveEdit(cat.id); if (e.key === "Escape") setEditingId(null); }}
                      className="flex-1 text-sm px-2 py-1 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button onClick={() => saveEdit(cat.id)} className="text-emerald-600 hover:text-emerald-700 p-1 rounded">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-gray-700 truncate">{cat.name}</span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingId(cat.id); setEditingName(cat.name); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                        title="Edit"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteCategory(cat)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add new category input */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">New Category</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
                placeholder="e.g. Protein"
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <button
                type="button"
                onClick={addCategory}
                disabled={!newCatName.trim() || addingCat}
                className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
