"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import { useFormatCurrency } from "@/components/providers/CurrencyProvider";
import { Plus, X } from "lucide-react";

interface Recurring {
  id: string;
  memberName: string;
  amount: number;
  description: string | null;
  billingCycle: string;
  frequency: number;
  firstPayment: string;
  nextPayment: string | null;
  status: string;
  paymentMethod: string;
}

interface Member { id: string; firstName: string; lastName: string; }

const CYCLE_LABEL: Record<string, string> = { DAILY: "Day(s)", WEEKLY: "Week(s)", MONTHLY: "Month(s)", YEARLY: "Year(s)" };
const METHOD_OPTIONS = [
  { value: "MANUAL", label: "Manual Payment" },
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Payment Card" },
  { value: "BANK_TRANSFER", label: "Bank Account" },
  { value: "CHECK", label: "Check" },
  { value: "BALANCE", label: "Balance" },
];

export default function RecurringTab() {
  const formatCurrency = useFormatCurrency();
  const [items, setItems] = useState<Recurring[]>([]);
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [showModal, setShowModal] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    memberId: "", amount: "", discount: "", addTax: false,
    frequency: "1", billingCycle: "MONTHLY", scheduledDay: "1",
    description: "", firstPayment: new Date().toISOString().split("T")[0],
    paymentMethod: "MANUAL",
  });

  const load = () => {
    fetch(`/api/billing/recurring?status=${statusFilter}`)
      .then(r => r.json()).then(d => setItems(d.items ?? []));
  };

  useEffect(load, [statusFilter]);

  const openModal = () => {
    fetch("/api/members?limit=200").then(r => r.json()).then(d => setMembers(d.members ?? []));
    setShowModal(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/billing/recurring", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    setSaving(false);
    setShowModal(false);
    load();
  };

  const cancel = async (id: string) => {
    if (!confirm("Cancel this recurring payment?")) return;
    await fetch(`/api/billing/recurring/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto" style={{scrollbarWidth:"none"}}>
          {["ACTIVE", "CANCELLED"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <button onClick={openModal} className="btn-primary">
          <Plus className="w-4 h-4" /> New Recurring Payment
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="table-th">Member</th>
              <th className="table-th">Amount</th>
              <th className="table-th">Details</th>
              <th className="table-th">Started</th>
              <th className="table-th">Next Payment</th>
              <th className="table-th">Status</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={7} className="table-td text-center py-10 text-gray-400">No recurring payments</td></tr>
            ) : items.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="table-td">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                      {r.memberName.charAt(0)}
                    </div>
                    <span className="font-medium text-sm text-gray-900">{r.memberName}</span>
                  </div>
                </td>
                <td className="table-td font-semibold">{formatCurrency(r.amount)}</td>
                <td className="table-td text-sm text-gray-500">
                  {r.description ?? "Subscription"} · Every {r.frequency} {CYCLE_LABEL[r.billingCycle]}
                </td>
                <td className="table-td text-sm text-gray-500">{formatDate(r.firstPayment)}</td>
                <td className="table-td text-sm text-gray-500">{r.nextPayment ? formatDate(r.nextPayment) : "—"}</td>
                <td className="table-td">
                  <span className={`badge ${r.status === "ACTIVE" ? "badge-green" : "badge-gray"}`}>
                    {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="table-td">
                  {r.status === "ACTIVE" && (
                    <button onClick={() => cancel(r.id)} className="text-xs text-red-600 hover:text-red-700 font-medium">Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-lg">Create Recurring Payment</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submit} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Member</label>
                <select className="select" value={form.memberId} onChange={e => setForm(f => ({ ...f, memberId: e.target.value }))} required>
                  <option value="">Select member…</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Amount (¢)</label>
                  <input className="input" type="number" min="0" step="0.01" placeholder="0.00"
                    value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">Discount (¢)</label>
                  <input className="input" type="number" min="0" step="0.01" placeholder="0.00"
                    value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.addTax} onChange={e => setForm(f => ({ ...f, addTax: e.target.checked }))} />
                Add Sales Tax
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Every</label>
                  <div className="flex gap-2">
                    <input className="input w-16" type="number" min="1" value={form.frequency}
                      onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} />
                    <select className="select flex-1" value={form.billingCycle}
                      onChange={e => setForm(f => ({ ...f, billingCycle: e.target.value }))}>
                      <option value="DAILY">Day(s)</option>
                      <option value="WEEKLY">Week(s)</option>
                      <option value="MONTHLY">Month(s)</option>
                      <option value="YEARLY">Year(s)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Scheduled Day</label>
                  <select className="select" value={form.scheduledDay}
                    onChange={e => setForm(f => ({ ...f, scheduledDay: e.target.value }))}>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}{d === 1 ? "st" : d === 2 ? "nd" : d === 3 ? "rd" : "th"}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <input className="input" placeholder="Appears on invoices and payment history"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">First Payment</label>
                  <input className="input" type="date" value={form.firstPayment}
                    onChange={e => setForm(f => ({ ...f, firstPayment: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">Payment Method</label>
                  <select className="select" value={form.paymentMethod}
                    onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                    {METHOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
                {saving ? "Creating…" : "Create Recurring Payment"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
