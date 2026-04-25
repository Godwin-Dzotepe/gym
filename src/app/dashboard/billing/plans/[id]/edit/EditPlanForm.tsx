"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EditPlanForm({ plan }: { plan: any }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: plan.name ?? "",
    description: plan.description ?? "",
    price: String(plan.price ?? ""),
    billingCycle: plan.billingCycle ?? "MONTHLY",
    duration: String(plan.duration ?? 1),
    maxMembers: plan.maxMembers ? String(plan.maxMembers) : "",
    features: plan.features ?? "",
    isActive: plan.isActive ?? true,
    allowFreezing: plan.allowFreezing ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`/api/plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) { setError((await res.json()).error ?? "Failed"); setLoading(false); return; }
    router.push("/dashboard/billing/plans");
  }

  return (
    <>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <form onSubmit={submit} className="space-y-4">
        <div className="form-group">
          <label className="label label-required">Plan Name</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} className="input" required />
        </div>
        <div className="form-group">
          <label className="label">Description</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className="input resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label label-required">Price</label>
            <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} className="input" required />
          </div>
          <div className="form-group">
            <label className="label">Billing Cycle</label>
            <select value={form.billingCycle} onChange={(e) => set("billingCycle", e.target.value)} className="select">
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label">Duration (cycles)</label>
            <input type="number" min="1" value={form.duration} onChange={(e) => set("duration", e.target.value)} className="input" />
          </div>
          <div className="form-group">
            <label className="label">Max Members</label>
            <input type="number" min="0" value={form.maxMembers} onChange={(e) => set("maxMembers", e.target.value)} className="input" placeholder="Unlimited" />
          </div>
        </div>
        <div className="form-group">
          <label className="label">Features (comma-separated)</label>
          <input value={form.features} onChange={(e) => set("features", e.target.value)} className="input" />
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="w-4 h-4" />
            <span className="text-sm text-slate-700">Active</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.allowFreezing} onChange={(e) => set("allowFreezing", e.target.checked)} className="w-4 h-4" />
            <span className="text-sm text-slate-700">Allow Freezing</span>
          </label>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">{loading ? "Saving..." : "Save Changes"}</button>
          <Link href="/dashboard/billing/plans" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </>
  );
}
