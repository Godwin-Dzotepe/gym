"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  RefreshCw, DollarSign, Zap, Clock,
  Infinity, CalendarDays, Calendar, Users, User, CheckCircle2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const PLAN_TYPES = [
  { value: "RECURRING",   label: "Recurring",   icon: RefreshCw, desc: "Charge on a recurring schedule" },
  { value: "ONE_TIME",    label: "One-time",     icon: DollarSign, desc: "Single upfront payment" },
  { value: "PER_SESSION", label: "Per-session",  icon: Zap,        desc: "Charged per attendance" },
  { value: "TRIAL",       label: "Trial",        icon: Clock,      desc: "Free or low-cost trial" },
];

const DURATION_TYPES = [
  { value: "ONGOING",        label: "Ongoing",         icon: Infinity,     desc: "No end date, renews indefinitely" },
  { value: "LIMITED",        label: "Limited Duration", icon: CalendarDays, desc: "Fixed length, then expires or renews" },
  { value: "SPECIFIC_DATES", label: "Specific Dates",  icon: Calendar,     desc: "Active between set start and end dates" },
];

const MEMBER_TYPES = [
  { value: "SINGLE", label: "Single Member", icon: User,  desc: "Assigned to one member" },
  { value: "FAMILY", label: "Family Shared", icon: Users, desc: "Shared across a family account" },
];

function SectionHeader({ number, title, subtitle }: { number: number; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-7 h-7 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <p className="font-semibold text-slate-900 text-[15px]">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

export default function EditPlanForm({ plan }: { plan: any }) {
  const router = useRouter();
  const toast  = useToast();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const [form, setForm] = useState({
    name:               plan.name            ?? "",
    description:        plan.description     ?? "",
    isFamilyShared:     plan.isFamilyShared  ?? false,
    planType:           plan.planType        ?? "RECURRING",
    dailyPrice:         plan.dailyPrice   != null ? String(plan.dailyPrice)   : "",
    weeklyPrice:        plan.weeklyPrice  != null ? String(plan.weeklyPrice)  : "",
    monthlyPrice:       plan.monthlyPrice != null ? String(plan.monthlyPrice) : "",
    yearlyPrice:        plan.yearlyPrice  != null ? String(plan.yearlyPrice)  : "",
    billingCycle:       plan.billingCycle     ?? "MONTHLY",
    maxPayments:        plan.maxPayments  != null ? String(plan.maxPayments)  : "",
    frequency:          "1",
    signUpFee:          plan.signUpFee    != null ? String(plan.signUpFee)    : "",
    lateFee:            plan.lateFee      != null ? String(plan.lateFee)      : "",
    lateFeeAfterDays:   plan.lateFeeAfterDays != null ? String(plan.lateFeeAfterDays) : "5",
    startOnFirstCheckin: plan.startOnFirstCheckin ?? false,
    durationType:       plan.durationType    ?? "ONGOING",
    duration:           plan.duration     != null ? String(plan.duration)     : "1",
    durationUnit:       plan.billingCycle    ?? "MONTHLY",
    accessLimit:        plan.accessLimit  != null ? String(plan.accessLimit)  : "",
    capacity:           plan.capacity     != null ? String(plan.capacity)     : "",
    familyDiscount2nd:  plan.familyDiscount2nd != null ? String(plan.familyDiscount2nd) : "",
    familyDiscount3rd:  plan.familyDiscount3rd != null ? String(plan.familyDiscount3rd) : "",
    familyDiscount4th:  plan.familyDiscount4th != null ? String(plan.familyDiscount4th) : "",
    trialCancelAtEnd:   plan.trialCancelAtEnd ?? true,
    cancellationFee:    plan.cancellationFee != null ? String(plan.cancellationFee) : "",
    allowFreezing:      plan.allowFreezing   ?? true,
    isActive:           plan.isActive        ?? true,
    features:           plan.features        ?? "",
  });

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? `Error ${res.status}`); setLoading(false); return; }
      toast.success("Membership plan updated successfully.");
      router.push("/dashboard/billing/plans");
    } catch (err: any) {
      setError(err.message ?? "Network error");
      setLoading(false);
    }
  }

  return (
    <>
      {error && (
        <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <span className="text-red-400 mt-0.5">⚠</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={submit} className="space-y-5">

        {/* ── Section 1: Details ── */}
        <div className="card p-6">
          <SectionHeader number={1} title="Membership Details" subtitle="General membership name, description, and type" />

          <div className="space-y-4">
            <div>
              <label className="label label-required">Title</label>
              <input className="input" placeholder="e.g. Monthly Unlimited" required
                value={form.name} onChange={e => set("name", e.target.value)} />
            </div>

            <div>
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={2} placeholder="Optional description shown to members…"
                value={form.description} onChange={e => set("description", e.target.value)} />
            </div>

            <div>
              <label className="label">Member Type</label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                {MEMBER_TYPES.map(t => {
                  const Icon   = t.icon;
                  const active = (t.value === "FAMILY") === form.isFamilyShared;
                  return (
                    <button key={t.value} type="button"
                      onClick={() => set("isFamilyShared", t.value === "FAMILY")}
                      className={`relative flex items-start gap-3 border-2 rounded-xl p-4 text-left transition-all ${
                        active ? "border-sky-500 bg-sky-50" : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-sky-100" : "bg-slate-100"}`}>
                        <Icon className={`w-4 h-4 ${active ? "text-sky-600" : "text-slate-400"}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${active ? "text-sky-700" : "text-slate-700"}`}>{t.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{t.desc}</p>
                      </div>
                      {active && <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-sky-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 2: Pricing ── */}
        <div className="card p-6">
          <SectionHeader number={2} title="Pricing" subtitle="Set the cost, frequency, and fee options for this membership" />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {PLAN_TYPES.map(t => {
              const Icon   = t.icon;
              const active = form.planType === t.value;
              return (
                <button key={t.value} type="button"
                  onClick={() => set("planType", t.value)}
                  className={`flex flex-col items-center gap-2 border-2 rounded-xl p-3.5 text-center transition-all ${
                    active ? "border-sky-500 bg-sky-50" : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${active ? "bg-sky-100" : "bg-slate-100"}`}>
                    <Icon className={`w-4 h-4 ${active ? "text-sky-600" : "text-slate-400"}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold leading-tight ${active ? "text-sky-700" : "text-slate-600"}`}>{t.label}</p>
                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5 hidden sm:block">{t.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pricing per Billing Cycle</p>
              <p className="text-xs text-slate-400 mb-3">Set prices for each billing frequency you want to offer. Leave blank to disable that option.</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "dailyPrice",   label: "Daily",   hint: "per day"   },
                  { key: "weeklyPrice",  label: "Weekly",  hint: "per week"  },
                  { key: "monthlyPrice", label: "Monthly", hint: "per month" },
                  { key: "yearlyPrice",  label: "Yearly",  hint: "per year"  },
                ].map(f => (
                  <div key={f.key}>
                    <label className="label">{f.label} <span className="text-slate-400 font-normal text-[10px]">({f.hint})</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                      <input className="input pl-7" type="number" min="0" step="0.01" placeholder="—"
                        value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">At least one price is required.</p>
            </div>

            {form.planType === "RECURRING" && (
              <div>
                <label className="label">Max Payments <span className="text-slate-400 font-normal">(optional)</span></label>
                <select className="select" value={form.maxPayments} onChange={e => set("maxPayments", e.target.value)}>
                  <option value="">No limit (ongoing)</option>
                  {[2, 3, 4, 6, 12, 24, 36].map(n => (
                    <option key={n} value={n}>{n} payments then expires</option>
                  ))}
                </select>
              </div>
            )}

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-sky-500 cursor-pointer"
                checked={form.startOnFirstCheckin}
                onChange={e => set("startOnFirstCheckin", e.target.checked)} />
              <div>
                <p className="text-sm font-medium text-slate-700">Start membership on first check-in</p>
                <p className="text-xs text-slate-400">Billing begins the day the member first checks in</p>
              </div>
            </label>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Fees</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Sign-up Fee</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input className="input pl-7" type="number" min="0" step="0.01" placeholder="0.00"
                      value={form.signUpFee} onChange={e => set("signUpFee", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label">Late Fee</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input className="input pl-7" type="number" min="0" step="0.01" placeholder="0.00"
                      value={form.lateFee} onChange={e => set("lateFee", e.target.value)} />
                  </div>
                  <p className="form-hint mt-1">
                    After{" "}
                    <input className="inline-block w-10 text-center text-xs border border-slate-200 rounded px-1 py-0.5 mx-1"
                      type="number" min="1" value={form.lateFeeAfterDays}
                      onChange={e => set("lateFeeAfterDays", e.target.value)} />
                    days overdue
                  </p>
                </div>
              </div>
            </div>

            {form.isFamilyShared && (
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Family Discounts</p>
                <p className="text-xs text-slate-400 mb-3">Percentage discount applied to additional family members.</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "familyDiscount2nd", label: "2nd Member" },
                    { key: "familyDiscount3rd", label: "3rd Member" },
                    { key: "familyDiscount4th", label: "4th+ Member" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="label">{f.label}</label>
                      <div className="relative">
                        <input className="input pr-7" type="number" min="0" max="100" placeholder="0"
                          value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Section 3: Duration ── */}
        <div className="card p-6">
          <SectionHeader number={3} title="Duration" subtitle="How long does this membership last?" />

          <div className="grid grid-cols-3 gap-3 mb-4">
            {DURATION_TYPES.map(d => {
              const Icon   = d.icon;
              const active = form.durationType === d.value;
              return (
                <button key={d.value} type="button"
                  onClick={() => set("durationType", d.value)}
                  className={`flex flex-col items-center gap-2 border-2 rounded-xl p-4 text-center transition-all ${
                    active ? "border-sky-500 bg-sky-50" : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? "bg-sky-100" : "bg-slate-100"}`}>
                    <Icon className={`w-5 h-5 ${active ? "text-sky-600" : "text-slate-400"}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${active ? "text-sky-700" : "text-slate-600"}`}>{d.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{d.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {form.durationType === "LIMITED" && (
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <div>
                <label className="label">Membership Duration</label>
                <div className="flex gap-2">
                  <input className="input w-20 text-center" type="number" min="1" value={form.duration}
                    onChange={e => set("duration", e.target.value)} />
                  <select className="select flex-1" value={form.durationUnit}
                    onChange={e => { set("durationUnit", e.target.value); set("billingCycle", e.target.value); }}>
                    <option value="DAILY">Day(s)</option>
                    <option value="WEEKLY">Week(s)</option>
                    <option value="MONTHLY">Month(s)</option>
                    <option value="YEARLY">Year(s)</option>
                  </select>
                </div>
              </div>

              {form.planType === "TRIAL" && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">At the end of the trial</p>
                  <div className="flex gap-4">
                    {[{ v: true, l: "Cancel trial" }, { v: false, l: "Convert to paid membership" }].map(o => (
                      <label key={String(o.v)} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                        <input type="radio" name="trialEnd" className="accent-sky-500"
                          checked={form.trialCancelAtEnd === o.v}
                          onChange={() => set("trialCancelAtEnd", o.v)} />
                        {o.l}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="label">Cancellation Fee</label>
                <div className="relative w-44">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input className="input pl-7" type="number" min="0" step="0.01" placeholder="0.00"
                    value={form.cancellationFee} onChange={e => set("cancellationFee", e.target.value)} />
                </div>
                <p className="form-hint mt-1">Charged if the member cancels before the end of their term</p>
              </div>
            </div>
          )}

          <div className={form.durationType === "LIMITED" ? "border-t border-slate-100 pt-4 mt-4" : ""}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-sky-500 cursor-pointer"
                checked={form.allowFreezing}
                onChange={e => set("allowFreezing", e.target.checked)} />
              <div>
                <p className="text-sm font-medium text-slate-700">Allow membership freezing</p>
                <p className="text-xs text-slate-400">Members can pause this membership temporarily</p>
              </div>
            </label>
          </div>
        </div>

        {/* ── Section 4: Access ── */}
        <div className="card p-6">
          <SectionHeader number={4} title="Access To Training" subtitle="Set attendance limits and capacity for this membership" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Attendance Limit</label>
              <select className="select" value={form.accessLimit} onChange={e => set("accessLimit", e.target.value)}>
                <option value="">Unlimited</option>
                {[1, 2, 3, 4, 5, 8, 10, 12, 15, 20].map(n => (
                  <option key={n} value={n}>{n}× per month</option>
                ))}
              </select>
              <p className="form-hint mt-1">How many times a member can attend per month</p>
            </div>
            <div>
              <label className="label">Membership Capacity</label>
              <select className="select" value={form.capacity} onChange={e => set("capacity", e.target.value)}>
                <option value="">Unlimited</option>
                {[5, 10, 20, 30, 50, 100].map(n => (
                  <option key={n} value={n}>{n} members</option>
                ))}
              </select>
              <p className="form-hint mt-1">Maximum number of members on this plan</p>
            </div>
          </div>
        </div>

        {/* ── Submit ── */}
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard/billing/plans" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary px-6">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
              : "Save Changes"
            }
          </button>
        </div>

      </form>
    </>
  );
}
