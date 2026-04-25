"use client";

import { useEffect, useState } from "react";
import { useFormatCurrency } from "@/components/providers/CurrencyProvider";
import { Plus, X, Trash2 } from "lucide-react";

interface Discount {
  id: string;
  code: string;
  name: string | null;
  type: string;
  value: number;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
}

export default function DiscountsTab() {
  const formatCurrency = useFormatCurrency();
  const [items, setItems] = useState<Discount[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "", name: "", type: "PERCENT", value: "", usageLimit: "", expiresAt: "",
  });

  const load = () => fetch("/api/billing/discounts").then(r => r.json()).then(d => setItems(d.discounts ?? []));
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/billing/discounts", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    setSaving(false);
    setShowModal(false);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this discount?")) return;
    await fetch(`/api/billing/discounts/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Discount
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="table-th">Code</th>
              <th className="table-th">Name</th>
              <th className="table-th">Value</th>
              <th className="table-th">Used</th>
              <th className="table-th">Expires</th>
              <th className="table-th">Status</th>
              <th className="table-th"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={7} className="table-td text-center py-10 text-gray-400">No discounts yet</td></tr>
            ) : items.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="table-td font-mono font-semibold text-indigo-600">{d.code}</td>
                <td className="table-td text-sm text-gray-700">{d.name ?? "—"}</td>
                <td className="table-td font-medium">
                  {d.type === "PERCENT" ? `${d.value}% off` : formatCurrency(d.value)}
                </td>
                <td className="table-td text-sm text-gray-500">
                  {d.usedCount}{d.usageLimit ? ` / ${d.usageLimit}` : ""}
                </td>
                <td className="table-td text-sm text-gray-500">
                  {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : "Never"}
                </td>
                <td className="table-td">
                  <span className={`badge ${d.isActive ? "badge-green" : "badge-gray"}`}>
                    {d.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="table-td">
                  <button onClick={() => del(d.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">New Discount</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submit} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Discount Code</label>
                <input className="input uppercase" placeholder="e.g. SUMMER20" required
                  value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
              </div>
              <div>
                <label className="label">Name (optional)</label>
                <input className="input" placeholder="Summer promo"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Type</label>
                  <select className="select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="PERCENT">Percent (%)</option>
                    <option value="FIXED">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="label">Value</label>
                  <input className="input" type="number" min="0" step="0.01" required
                    value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Usage Limit</label>
                  <input className="input" type="number" min="1" placeholder="Unlimited"
                    value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Expires</label>
                  <input className="input" type="date"
                    value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
                </div>
              </div>
              <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
                {saving ? "Saving…" : "Create Discount"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
