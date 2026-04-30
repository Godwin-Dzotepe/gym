"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { useFormatCurrency } from "@/components/providers/CurrencyProvider";
import { Plus, X, Snowflake, Pause, XCircle, CheckCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";

interface MemberPlanRow {
  id: string;
  planId: string;
  planName: string;
  planType: string;
  price: number;
  billingCycle: string;
  startDate: string;
  endDate: string | null;
  paymentMethod: string;
  isActive: boolean;
  isFrozen: boolean;
  isPaused: boolean;
  cancelledAt: string | null;
}

interface Plan { id: string; name: string; price: number; billingCycle: string; planType: string; }

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash", CARD: "Card", MANUAL: "Manual Payment", BANK_TRANSFER: "Bank Account",
  CHECK: "Check", ONLINE: "Online",
};

const CYCLE_LABEL: Record<string, string> = { DAILY: "/day", WEEKLY: "/wk", MONTHLY: "/mo", YEARLY: "/yr" };

export default function MemberMemberships({
  memberId, memberPlans,
}: { memberId: string; memberPlans: MemberPlanRow[] }) {
  const formatCurrency = useFormatCurrency();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [showAdd, setShowAdd] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("MANUAL");
  const [saving, setSaving] = useState(false);
  const [renewingId, setRenewingId] = useState<string | null>(null);

  const openAdd = async () => {
    const res = await fetch("/api/plans");
    const data = await res.json();
    setPlans(data);
    setShowAdd(true);
  };

  const addMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/members/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, planId: selectedPlan, startDate, paymentMethod }),
    });
    setSaving(false);
    setShowAdd(false);
    toast.success("Membership assigned successfully.");
    router.refresh();
  };

  const renewMembership = async (mp: MemberPlanRow) => {
    const ok = await confirm({
      title: "Renew Membership?",
      message: `This will create a new ${mp.planName} membership starting from ${mp.endDate ? formatDate(mp.endDate) : "today"}.`,
      confirmLabel: "Renew",
      danger: false,
    });
    if (!ok) return;
    setRenewingId(mp.id);
    // Start the new term from where the current one ends (or today if already expired)
    const nextStart = mp.endDate && new Date(mp.endDate) > new Date()
      ? mp.endDate.split("T")[0]
      : new Date().toISOString().split("T")[0];
    await fetch("/api/members/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, planId: mp.planId, startDate: nextStart, paymentMethod: mp.paymentMethod }),
    });
    setRenewingId(null);
    toast.success(`${mp.planName} renewed successfully.`);
    router.refresh();
  };

  const ACTION_CONFIG: Record<string, { title: string; message: string; label: string; danger: boolean; successMsg: string }> = {
    freeze:   { title: "Freeze Membership?",   message: "The membership will be paused until unfrozen.",     label: "Freeze",   danger: true,  successMsg: "Membership frozen." },
    unfreeze: { title: "Unfreeze Membership?", message: "The membership will be reactivated.",                label: "Unfreeze", danger: false, successMsg: "Membership unfrozen." },
    pause:    { title: "Pause Membership?",    message: "Billing will be paused for this membership.",        label: "Pause",    danger: true,  successMsg: "Membership paused." },
    resume:   { title: "Resume Membership?",   message: "Billing will resume for this membership.",           label: "Resume",   danger: false, successMsg: "Membership resumed." },
    cancel:   { title: "Cancel Membership?",   message: "This will cancel the membership. Are you sure?",    label: "Cancel",   danger: true,  successMsg: "Membership cancelled." },
  };

  const action = async (memberPlanId: string, actionName: string) => {
    const cfg = ACTION_CONFIG[actionName];
    if (cfg) {
      const ok = await confirm({ title: cfg.title, message: cfg.message, confirmLabel: cfg.label, danger: cfg.danger });
      if (!ok) return;
    }
    await fetch(`/api/members/plans/${memberPlanId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: actionName }),
    });
    if (cfg) toast.success(cfg.successMsg);
    router.refresh();
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="section-title">Memberships</h2>
        <button onClick={openAdd} className="btn-primary text-xs py-1.5 px-3">
          <Plus className="w-3.5 h-3.5" /> Add Membership
        </button>
      </div>

      <div className="divide-y divide-gray-50">
        {memberPlans.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400 mb-3">No memberships assigned</p>
            <button onClick={openAdd} className="btn-primary text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Membership
            </button>
          </div>
        ) : memberPlans.map((mp) => (
          <div key={mp.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900">{mp.planName}</p>
                  {mp.isActive && !mp.isFrozen && !mp.isPaused && (
                    <span className="badge badge-green text-xs">Active</span>
                  )}
                  {mp.isFrozen && <span className="badge badge-blue text-xs"><Snowflake className="w-3 h-3" /> Frozen</span>}
                  {mp.isPaused && <span className="badge badge-yellow text-xs"><Pause className="w-3 h-3" /> Paused</span>}
                  {!mp.isActive && <span className="badge badge-gray text-xs">Cancelled</span>}
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500">
                  <span>Start Date: <span className="text-gray-700">{formatDate(mp.startDate)}</span></span>
                  {mp.endDate && <span>Expiring: <span className="text-gray-700">{formatDate(mp.endDate)}</span></span>}
                  <span>Payment: <span className="text-gray-700">{METHOD_LABELS[mp.paymentMethod] ?? mp.paymentMethod}</span></span>
                  <span>Access: <span className="text-gray-700">Unlimited</span></span>
                  <span className="font-medium text-gray-700">
                    {formatCurrency(mp.price)}{CYCLE_LABEL[mp.billingCycle]}
                  </span>
                </div>
              </div>

              {mp.isActive && (
                <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
                  <button onClick={() => renewMembership(mp)} disabled={renewingId === mp.id}
                    className="text-xs px-2 py-1 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 flex items-center gap-1">
                    <RefreshCw className={`w-3 h-3 ${renewingId === mp.id ? "animate-spin" : ""}`} />
                    {renewingId === mp.id ? "Renewing…" : "Renew"}
                  </button>
                  {!mp.isFrozen && (
                    <button onClick={() => action(mp.id, "freeze")}
                      className="text-xs px-2 py-1 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 flex items-center gap-1">
                      <Snowflake className="w-3 h-3" /> Freeze
                    </button>
                  )}
                  {mp.isFrozen && (
                    <button onClick={() => action(mp.id, "unfreeze")}
                      className="text-xs px-2 py-1 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Unfreeze
                    </button>
                  )}
                  {!mp.isPaused && (
                    <button onClick={() => action(mp.id, "pause")}
                      className="text-xs px-2 py-1 rounded-lg border border-yellow-200 text-yellow-600 hover:bg-yellow-50 flex items-center gap-1">
                      <Pause className="w-3 h-3" /> Pause
                    </button>
                  )}
                  <button onClick={() => action(mp.id, "cancel")}
                    className="text-xs px-2 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Membership Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Select Membership Option</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={addMembership} className="px-6 py-5 space-y-4">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {plans.map(p => (
                  <button key={p.id} type="button"
                    onClick={() => setSelectedPlan(p.id)}
                    className={`w-full border-2 rounded-xl px-4 py-3 text-left transition-all ${
                      selectedPlan === p.id ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
                    }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400">
                          {p.planType.charAt(0) + p.planType.slice(1).toLowerCase().replace("_", "-")} · Unlimited
                        </p>
                      </div>
                      <span className={`font-semibold ${selectedPlan === p.id ? "text-indigo-600" : "text-gray-700"}`}>
                        {formatCurrency(p.price)}
                        <span className="text-xs font-normal text-gray-400">{CYCLE_LABEL[p.billingCycle]}</span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Date</label>
                  <input className="input" type="date" value={startDate}
                    onChange={e => setStartDate(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Payment Method</label>
                  <select className="input" value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}>
                    <option value="MANUAL">Manual Payment</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank Account</option>
                    <option value="CHECK">Check</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={saving || !selectedPlan} className="btn-primary w-full justify-center">
                {saving ? "Assigning…" : "Assign Membership"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
