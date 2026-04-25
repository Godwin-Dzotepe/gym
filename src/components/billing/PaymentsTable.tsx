"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import { useFormatCurrency } from "@/components/providers/CurrencyProvider";
import Link from "next/link";
import { Download, FileText, Ban, Gift, Loader2 } from "lucide-react";
import MarkPaidButton from "./MarkPaidButton";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";

interface Invoice {
  id: string;
  invoiceNumber: string;
  memberName: string;
  description: string | null;
  amount: number;
  total: number;
  status: string;
  paymentMethod: string;
  dueDate: string;
  paidAt: string | null;
}

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash", CARD: "Card", BANK_TRANSFER: "Bank Account",
  MANUAL: "Manual Payment", CHECK: "Check", REFERRAL_CREDIT: "Referral Credit",
  INVOICE: "Invoice", BALANCE: "Balance", IDEAL: "iDeal", BANCONTACT: "Bancontact", SKIPPED: "Skipped", ONLINE: "Online",
};

export default function PaymentsTable({ status }: { status?: string }) {
  const formatCurrency = useFormatCurrency();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(status ?? "");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  async function invoiceAction(inv: Invoice, action: "void" | "waive") {
    const label = action === "void" ? "Void" : "Waive";
    const ok = await confirm({
      title: `${label} Invoice?`,
      message: action === "void"
        ? `Invoice ${inv.invoiceNumber} will be voided. This cannot be undone.`
        : `Invoice ${inv.invoiceNumber} will be marked as waived (no payment required).`,
      confirmLabel: label,
      danger: action === "void",
    });
    if (!ok) return;
    setActionLoading(inv.id);
    const res = await fetch(`/api/invoices/${inv.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setActionLoading(null);
    if (!res.ok) { toast.error(`Failed to ${label.toLowerCase()} invoice.`); return; }
    toast.success(`Invoice ${label.toLowerCase()}d.`);
    setInvoices(p => p.map(i => i.id === inv.id ? { ...i, status: action === "void" ? "VOID" : "WAIVED" } : i));
  }

  const tabs = ["", "PAID", "PENDING", "FAILED", "REFUNDED", "VOID", "WAIVED"];

  useEffect(() => {
    setLoading(true);
    const q = filter ? `?status=${filter}` : "";
    fetch(`/api/invoices${q}`).then(r => r.json()).then(d => {
      setInvoices(d.invoices ?? []);
      setLoading(false);
    });
  }, [filter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto flex-1 sm:flex-none" style={{scrollbarWidth:'none'}}>
          {tabs.map((t) => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              {t || "All"}
            </button>
          ))}
        </div>
        <button className="btn-secondary text-sm"><Download className="w-4 h-4" /> Export</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="table-th hidden sm:table-cell">Invoice #</th>
              <th className="table-th">Member</th>
              <th className="table-th hidden md:table-cell">Description</th>
              <th className="table-th">Amount</th>
              <th className="table-th hidden md:table-cell">Method</th>
              <th className="table-th hidden sm:table-cell">Due</th>
              <th className="table-th">Status</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="table-td text-center py-10 text-gray-400">Loading…</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={5} className="table-td text-center py-10 text-gray-400">No invoices found</td></tr>
            ) : invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="table-td font-mono text-xs text-gray-500 hidden sm:table-cell">{inv.invoiceNumber}</td>
                <td className="table-td font-medium text-gray-900">{inv.memberName}</td>
                <td className="table-td text-sm text-gray-500 hidden md:table-cell">{inv.description ?? "—"}</td>
                <td className="table-td font-semibold">{formatCurrency(inv.total)}</td>
                <td className="table-td text-sm text-gray-500 hidden md:table-cell">{METHOD_LABELS[inv.paymentMethod] ?? inv.paymentMethod}</td>
                <td className="table-td text-sm text-gray-500 hidden sm:table-cell">{formatDate(inv.dueDate)}</td>
                <td className="table-td">
                  <span className={`badge ${
                    inv.status === "PAID" ? "badge-green" :
                    inv.status === "PENDING" ? "badge-yellow" :
                    inv.status === "FAILED" ? "badge-red" :
                    inv.status === "WAIVED" ? "badge-blue" : "badge-gray"
                  }`}>{inv.status.charAt(0) + inv.status.slice(1).toLowerCase()}</span>
                </td>
                <td className="table-td">
                  <div className="flex items-center gap-1">
                    {inv.status === "PENDING" && <MarkPaidButton invoiceId={inv.id} />}
                    {inv.status === "PENDING" && (
                      <button onClick={() => invoiceAction(inv, "waive")} disabled={actionLoading === inv.id}
                        title="Waive invoice"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50">
                        {actionLoading === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Gift className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    {(inv.status === "PENDING" || inv.status === "FAILED") && (
                      <button onClick={() => invoiceAction(inv, "void")} disabled={actionLoading === inv.id}
                        title="Void invoice"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                        {actionLoading === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <Link href={`/dashboard/billing/${inv.id}`}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50" title="Receipt">
                      <FileText className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
