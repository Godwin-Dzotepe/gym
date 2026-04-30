"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, X, Plus, Minus, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useFormatCurrency } from "@/components/providers/CurrencyProvider";

export default function MemberBalanceButton({ memberId, balance }: { memberId: string; balance: number }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const formatCurrency = useFormatCurrency();

  function close() { setOpen(false); setAmount(""); setType("credit"); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) { toast.error("Enter a valid amount."); return; }
    setSaving(true);
    const res = await fetch(`/api/members/${memberId}/balance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: type === "credit" ? num : -num }),
    });
    setSaving(false);
    if (!res.ok) { toast.error("Failed to update balance."); return; }
    toast.success(`Balance ${type === "credit" ? "credited" : "debited"} successfully.`);
    close();
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary text-xs">
        <Wallet className="w-3.5 h-3.5" /> Adjust Balance
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Adjust Balance</h2>
              <button onClick={close}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={submit} className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-500">
                Current balance: <span className="font-semibold text-gray-900">{formatCurrency(balance)}</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setType("credit")}
                  className={`border-2 rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
                    type === "credit" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}>
                  <Plus className="w-3.5 h-3.5" /> Credit
                </button>
                <button type="button" onClick={() => setType("debit")}
                  className={`border-2 rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
                    type === "debit" ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}>
                  <Minus className="w-3.5 h-3.5" /> Debit
                </button>
              </div>
              <div className="form-group">
                <label className="label">Amount</label>
                <input type="number" min="0.01" step="0.01" className="input" value={amount}
                  onChange={e => setAmount(e.target.value)} placeholder="0.00" required autoFocus />
              </div>
              <button type="submit" disabled={saving}
                className={`w-full justify-center flex items-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                  type === "credit"
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }`}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : type === "credit" ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                {saving ? "Saving…" : type === "credit" ? "Add Credit" : "Debit Balance"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
