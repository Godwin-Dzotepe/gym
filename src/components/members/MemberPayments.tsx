"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { useFormatCurrency } from "@/components/providers/CurrencyProvider";
import { FileText, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  description: string | null;
  total: number;
  status: string;
  paymentMethod: string;
  dueDate: string;
  paidAt: string | null;
}

const METHOD_OPTIONS = [
  { value: "MANUAL", label: "Manual Payment" },
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Payment Card" },
  { value: "BANK_TRANSFER", label: "Bank Account" },
  { value: "CHECK", label: "Check" },
  { value: "BALANCE", label: "Balance" },
];

export default function MemberPayments({ memberId, invoices }: { memberId: string; invoices: InvoiceRow[] }) {
  const formatCurrency = useFormatCurrency();
  const router = useRouter();
  const toast = useToast();
  const [showCharge, setShowCharge] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    amount: "", discount: "", addTax: false, description: "",
    chargeDate: new Date().toISOString().split("T")[0],
    sendEmail: true, paymentMethod: "MANUAL", transactionId: "",
  });

  const createCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId,
        description: form.description,
        amount: parseFloat(form.amount),
        discount: parseFloat(form.discount || "0"),
        dueDate: form.chargeDate,
        paymentMethod: form.paymentMethod,
        transactionId: form.transactionId || null,
        sendEmail: form.sendEmail,
        status: "PAID",
      }),
    });
    setSaving(false);
    setShowCharge(false);
    toast.success("Charge created successfully.");
    router.refresh();
  };

  const markPaid = async (id: string) => {
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID", paidAt: new Date().toISOString() }),
    });
    router.refresh();
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="section-title">Payments</h2>
        <div className="flex gap-2">
          <Link href={`/dashboard/billing?tab=payments&memberId=${memberId}`}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">All Payments</Link>
          <button onClick={() => setShowCharge(true)} className="btn-primary text-xs py-1.5 px-3">
            <Plus className="w-3.5 h-3.5" /> Create Payment
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="table-th">Invoice #</th>
              <th className="table-th">Description</th>
              <th className="table-th">Amount</th>
              <th className="table-th">Date</th>
              <th className="table-th">Status</th>
              <th className="table-th"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan={6} className="table-td text-center py-8 text-gray-400">No payments yet</td></tr>
            ) : invoices.map(inv => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="table-td font-mono text-xs text-gray-500">{inv.invoiceNumber}</td>
                <td className="table-td text-sm text-gray-600">{inv.description ?? "—"}</td>
                <td className="table-td font-semibold">{formatCurrency(inv.total)}</td>
                <td className="table-td text-xs text-gray-500">
                  {inv.paidAt ? formatDate(inv.paidAt) : formatDate(inv.dueDate)}
                </td>
                <td className="table-td">
                  <span className={`badge ${
                    inv.status === "PAID" ? "badge-green" :
                    inv.status === "PENDING" ? "badge-yellow" : "badge-red"
                  }`}>
                    {inv.status === "PAID" ? "✓ Paid" : inv.status.charAt(0) + inv.status.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="table-td">
                  <div className="flex items-center gap-2">
                    {inv.status === "PENDING" && (
                      <button onClick={() => markPaid(inv.id)}
                        className="text-xs text-green-600 hover:text-green-700 font-medium">Mark Paid</button>
                    )}
                    <Link href={`/dashboard/billing/${inv.id}`}
                      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600">
                      <FileText className="w-3.5 h-3.5" /> Receipt
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Charge Modal */}
      {showCharge && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Create Charge</h2>
              <button onClick={() => setShowCharge(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={createCharge} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¢</span>
                    <input className="input pl-7" type="number" min="0" step="0.01" required
                      value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="label">Discount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¢</span>
                    <input className="input pl-7" type="number" min="0" step="0.01"
                      value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <input className="input" placeholder="Charge description…"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.addTax} onChange={e => setForm(f => ({ ...f, addTax: e.target.checked }))} />
                Add Sales Tax
              </label>
              <div>
                <label className="label">Charge Date</label>
                <input className="input" type="date" value={form.chargeDate}
                  onChange={e => setForm(f => ({ ...f, chargeDate: e.target.value }))} required />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.sendEmail}
                  onChange={e => setForm(f => ({ ...f, sendEmail: e.target.checked }))} />
                Send Email Invoice
              </label>
              <div>
                <label className="label">Payment Method</label>
                <select className="input" value={form.paymentMethod}
                  onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                  {METHOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
                {saving ? "Creating…" : "Create Payment"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
