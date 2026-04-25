"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Save, Loader2, Check, Gift, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { formatDate } from "@/lib/utils";
import { useFormatCurrency } from "@/components/providers/CurrencyProvider";

interface Referral { id: string; referrerId: string; referrerName: string; referredEmail: string; referredName: string; converted: boolean; rewardGiven: boolean; rewardAmount: number | null; createdAt: string; convertedAt: string | null; }
interface Member { id: string; firstName: string; lastName: string; }

export default function ReferralsManager({ referrals: initial, members }: { referrals: Referral[]; members: Member[] }) {
  const formatCurrency = useFormatCurrency();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [referrals, setReferrals] = useState(initial);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [form, setForm] = useState({ referrerId: "", referredEmail: "", referredName: "", rewardAmount: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) { toast.error("Failed to create referral."); return; }
    toast.success("Referral recorded.");
    setShowModal(false);
    setForm({ referrerId: "", referredEmail: "", referredName: "", rewardAmount: "" });
    router.refresh();
  }

  async function markConverted(r: Referral) {
    setActionLoading(r.id);
    await fetch(`/api/referrals/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ converted: true, rewardGiven: r.rewardGiven }),
    });
    setActionLoading(null);
    toast.success("Marked as converted.");
    setReferrals(prev => prev.map(x => x.id === r.id ? { ...x, converted: true, convertedAt: new Date().toISOString() } : x));
  }

  async function markRewarded(r: Referral) {
    setActionLoading(r.id);
    await fetch(`/api/referrals/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ converted: r.converted, rewardGiven: true }),
    });
    setActionLoading(null);
    toast.success("Reward marked as given.");
    setReferrals(prev => prev.map(x => x.id === r.id ? { ...x, rewardGiven: true } : x));
  }

  async function deleteReferral(r: Referral) {
    const ok = await confirm({ title: "Delete Referral?", message: `Delete referral for ${r.referredName}?`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    await fetch(`/api/referrals/${r.id}`, { method: "DELETE" });
    toast.success("Referral deleted.");
    setReferrals(prev => prev.filter(x => x.id !== r.id));
  }

  return (
    <>
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="section-title">Referral Records</h2>
          <button onClick={() => setShowModal(true)} className="btn-primary text-xs py-1.5 px-3">
            <Plus className="w-3.5 h-3.5" /> Add Referral
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="table-th">Referred By</th>
              <th className="table-th">Referred Person</th>
              <th className="table-th">Reward</th>
              <th className="table-th">Date</th>
              <th className="table-th">Status</th>
              <th className="table-th">Reward</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {referrals.length === 0 ? (
              <tr><td colSpan={7} className="table-td text-center py-10 text-gray-400">No referrals yet</td></tr>
            ) : referrals.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="table-td font-medium text-gray-900">{r.referrerName}</td>
                <td className="table-td">
                  <p className="text-sm font-medium text-gray-900">{r.referredName}</p>
                  <p className="text-xs text-gray-500">{r.referredEmail}</p>
                </td>
                <td className="table-td text-sm text-gray-600">{r.rewardAmount ? formatCurrency(r.rewardAmount) : "—"}</td>
                <td className="table-td text-sm text-gray-500">{formatDate(r.createdAt)}</td>
                <td className="table-td">
                  <span className={`badge ${r.converted ? "badge-green" : "badge-yellow"}`}>
                    {r.converted ? "Converted" : "Pending"}
                  </span>
                </td>
                <td className="table-td">
                  <span className={`badge ${r.rewardGiven ? "badge-green" : "badge-gray"}`}>
                    {r.rewardGiven ? "Given" : "Pending"}
                  </span>
                </td>
                <td className="table-td">
                  <div className="flex items-center gap-1">
                    {!r.converted && (
                      <button onClick={() => markConverted(r)} disabled={actionLoading === r.id}
                        title="Mark converted" className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50">
                        {actionLoading === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    {r.converted && !r.rewardGiven && (
                      <button onClick={() => markRewarded(r)} disabled={actionLoading === r.id}
                        title="Mark reward given" className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50">
                        {actionLoading === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Gift className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <button onClick={() => deleteReferral(r)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Record Referral</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={submit} className="px-6 py-5 space-y-4">
              <div className="form-group">
                <label className="label label-required">Referred By</label>
                <select className="select" required value={form.referrerId} onChange={e => setForm(p => ({ ...p, referrerId: e.target.value }))}>
                  <option value="">Select member…</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label label-required">Referred Person's Name</label>
                <input className="input" required value={form.referredName} onChange={e => setForm(p => ({ ...p, referredName: e.target.value }))} placeholder="Full name" />
              </div>
              <div className="form-group">
                <label className="label label-required">Email</label>
                <input className="input" type="email" required value={form.referredEmail} onChange={e => setForm(p => ({ ...p, referredEmail: e.target.value }))} placeholder="email@example.com" />
              </div>
              <div className="form-group">
                <label className="label">Reward Amount</label>
                <input className="input" type="number" min="0" step="0.01" value={form.rewardAmount} onChange={e => setForm(p => ({ ...p, rewardAmount: e.target.value }))} placeholder="0.00 (optional)" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving…" : "Save Referral"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
