"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

function NewInvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const memberId = searchParams.get("member") ?? "";

  const [members, setMembers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [form, setForm] = useState({
    memberId, planId: "", amount: "", tax: "0",
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/members?limit=500").then((r) => r.json()).then((d) => setMembers(d.members ?? d));
    fetch("/api/plans").then((r) => r.json()).then(setPlans);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        description: form.planId ? plans.find((p: any) => p.id === form.planId)?.name : undefined,
        planId: undefined,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      const d = text ? JSON.parse(text) : {};
      setError(d.error ?? "Failed to create invoice");
      setLoading(false);
      return;
    }
    const inv = await res.json();
    router.push(`/dashboard/billing/${inv.id}`);
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <Link href="/dashboard/billing" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-3.5 h-3.5" /> Billing
      </Link>
      <div className="card p-6">
        <h1 className="page-title mb-6">New Invoice</h1>
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        <form onSubmit={submit} className="space-y-4">
          <div className="form-group">
            <label className="label label-required">Member</label>
            <select value={form.memberId} onChange={(e) => setForm((p) => ({ ...p, memberId: e.target.value }))} className="select" required>
              <option value="">Select member...</option>
              {members.map((m: any) => (
                <option key={m.id} value={m.id}>{m.firstName} {m.lastName} — {m.memberNumber}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label">Membership Plan <span className="text-gray-400 font-normal">(optional — auto-fills amount)</span></label>
            <select
              value={form.planId}
              onChange={(e) => {
                const plan = plans.find((p: any) => p.id === e.target.value);
                setForm((prev) => ({
                  ...prev,
                  planId: e.target.value,
                  amount: plan ? String(plan.price) : prev.amount,
                }));
              }}
              className="select"
            >
              <option value="">One-time / No plan</option>
              {plans.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} — {p.price}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label label-required">Amount</label>
              <input type="number" step="0.01" min="0" value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                className="input" placeholder="0.00" required />
            </div>
            <div className="form-group">
              <label className="label">Tax</label>
              <input type="number" step="0.01" min="0" value={form.tax}
                onChange={(e) => setForm((p) => ({ ...p, tax: e.target.value }))}
                className="input" placeholder="0.00" />
            </div>
          </div>

          <div className="form-group">
            <label className="label label-required">Due Date</label>
            <input type="date" value={form.dueDate}
              onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
              className="input" required />
          </div>

          <div className="form-group">
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={3} className="input resize-none" placeholder="Optional notes..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Creating..." : "Create Invoice"}
            </button>
            <Link href="/dashboard/billing" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading…</div>}>
      <NewInvoiceForm />
    </Suspense>
  );
}
