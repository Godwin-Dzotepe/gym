"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDate, getInitials } from "@/lib/utils";
import { Plus, Pencil, X, Save, Loader2, UserX, UserCheck, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useFormatCurrency } from "@/components/providers/CurrencyProvider";

interface StaffMember {
  id: string; firstName: string; lastName: string; email: string;
  phone: string; position: string; role: string; isActive: boolean;
  createdAt: string; startDate?: string | null; endDate?: string | null;
}
interface Plan { id: string; name: string; price: number; billingCycle: string; planType: string; }

const ROLES = [{ value: "STAFF", label: "Staff" }, { value: "SUPER_ADMIN", label: "Admin" }];
const POSITIONS = ["Manager", "Trainer", "Coach", "Receptionist", "Accountant", "Cleaner", "Security", "Other"];
const CYCLE_LABEL: Record<string, string> = { DAILY: "/day", WEEKLY: "/wk", MONTHLY: "/mo", YEARLY: "/yr" };

const blank = {
  firstName: "", lastName: "", email: "", phone: "", position: "", role: "STAFF", password: "",
  startDate: new Date().toISOString().split("T")[0], endDate: "",
};

export default function StaffTable({ staff: initial }: { staff: StaffMember[] }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const formatCurrency = useFormatCurrency();
  const [staff, setStaff] = useState(initial);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<any>(blank);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [planPaymentMethod, setPlanPaymentMethod] = useState("MANUAL");

  useEffect(() => {
    fetch("/api/plans").then(r => r.json()).then(setPlans).catch(() => {});
  }, []);

  function openAdd() { setEditing(null); setForm(blank); setSelectedPlanId(""); setShowModal(true); }
  function openEdit(s: StaffMember) { setEditing(s); setForm({ ...s, password: "" }); setSelectedPlanId(""); setShowModal(true); }
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    if (editing) {
      const res = await fetch(`/api/staff/${editing.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      setSaving(false);
      if (!res.ok) { toast.error("Failed to update."); return; }
      toast.success("Staff member updated.");
    } else {
      const res = await fetch("/api/staff", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, planId: selectedPlanId || undefined, planPaymentMethod }),
      });
      setSaving(false);
      if (!res.ok) { toast.error((await res.json()).error ?? "Failed to add."); return; }
      toast.success("Staff member added.");
    }
    setShowModal(false);
    router.refresh();
  }

  async function deactivate(s: StaffMember) {
    const action = s.isActive ? "deactivate" : "reactivate";
    const ok = await confirm({ title: `${s.isActive ? "Deactivate" : "Reactivate"} Staff?`, message: `${s.firstName} ${s.lastName} will ${s.isActive ? "lose" : "regain"} system access.`, confirmLabel: s.isActive ? "Deactivate" : "Reactivate", danger: s.isActive });
    if (!ok) return;
    await fetch(`/api/staff/${s.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !s.isActive }) });
    toast.success(`Staff member ${action}d.`);
    router.refresh();
  }

  return (
    <>
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Team Members</h2>
          <button onClick={openAdd} className="btn-primary text-xs py-1.5 px-3">
            <Plus className="w-3.5 h-3.5" /> Add Staff
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="table-th">Name</th>
                <th className="table-th hidden sm:table-cell">Position</th>
                <th className="table-th">Role</th>
                <th className="table-th hidden md:table-cell">Phone</th>
                <th className="table-th">Status</th>
                <th className="table-th hidden lg:table-cell">Start Date</th>
                <th className="table-th hidden lg:table-cell">End Date</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 ? (
                <tr><td colSpan={8} className="table-td text-center py-12 text-gray-400">No staff members yet.</td></tr>
              ) : staff.map(s => (
                <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${!s.isActive ? "opacity-50" : ""}`}>
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 flex-shrink-0">
                        {getInitials(s.firstName, s.lastName)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{s.firstName} {s.lastName}</p>
                        <p className="text-xs text-gray-400">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td text-sm text-gray-600 hidden sm:table-cell">{s.position || "—"}</td>
                  <td className="table-td">
                    <span className={`badge ${s.role === "SUPER_ADMIN" ? "badge-purple" : "badge-blue"}`}>
                      {s.role === "SUPER_ADMIN" ? "Admin" : "Staff"}
                    </span>
                  </td>
                  <td className="table-td text-sm text-gray-500 hidden md:table-cell">{s.phone || "—"}</td>
                  <td className="table-td">
                    <span className={`badge ${s.isActive ? "badge-green" : "badge-gray"}`}>
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="table-td text-xs text-gray-400 hidden lg:table-cell">
                    {s.startDate ? formatDate(s.startDate) : "—"}
                  </td>
                  <td className="table-td text-xs hidden lg:table-cell">
                    {s.endDate ? (
                      <span className={`font-medium ${new Date(s.endDate) < new Date() ? "text-red-500" : "text-gray-600"}`}>
                        {formatDate(s.endDate)}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(s)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-medium">
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => deactivate(s)} className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium border ${s.isActive ? "border-red-200 text-red-600 hover:bg-red-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}>
                        {s.isActive ? <><UserX className="w-3 h-3" /> Deactivate</> : <><UserCheck className="w-3 h-3" /> Reactivate</>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editing ? "Edit Staff Member" : "Add Staff Member"}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={save} className="px-6 py-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group"><label className="label label-required">First Name</label>
                  <input className="input" required value={form.firstName} onChange={e => set("firstName", e.target.value)} /></div>
                <div className="form-group"><label className="label label-required">Last Name</label>
                  <input className="input" required value={form.lastName} onChange={e => set("lastName", e.target.value)} /></div>
              </div>
              <div className="form-group"><label className="label label-required">Email</label>
                <input className="input" type="email" required value={form.email} onChange={e => set("email", e.target.value)} disabled={!!editing} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group"><label className="label">Phone</label>
                  <input className="input" value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
                <div className="form-group"><label className="label">Position</label>
                  <select className="select" value={form.position} onChange={e => set("position", e.target.value)}>
                    <option value="">Select…</option>
                    {POSITIONS.map(p => <option key={p}>{p}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group"><label className="label">Role</label>
                  <select className="select" value={form.role} onChange={e => set("role", e.target.value)}>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select></div>
                <div className="form-group"><label className="label">{editing ? "New Password" : "Password *"}</label>
                  <input className="input" type="password" required={!editing} value={form.password} onChange={e => set("password", e.target.value)} placeholder={editing ? "Leave blank to keep" : ""} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group"><label className="label">Start Date</label>
                  <input className="input" type="date" value={form.startDate ?? ""} onChange={e => set("startDate", e.target.value)} /></div>
                <div className="form-group"><label className="label">End Date <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
                  <input className="input" type="date" value={form.endDate ?? ""} onChange={e => set("endDate", e.target.value)} /></div>
              </div>

              {/* Membership Plan (new staff only) */}
              {!editing && plans.length > 0 && (
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 mb-0.5">Membership Plan</p>
                    <p className="text-xs text-gray-400">Optional — assign a gym membership to this staff member.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button type="button" onClick={() => setSelectedPlanId("")}
                      className={`border-2 rounded-xl px-3 py-2 text-left text-sm transition-all ${selectedPlanId === "" ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">No Plan</span>
                        {selectedPlanId === "" && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
                      </div>
                    </button>
                    {plans.map(p => (
                      <button key={p.id} type="button" onClick={() => setSelectedPlanId(p.id)}
                        className={`border-2 rounded-xl px-3 py-2 text-left text-sm transition-all ${selectedPlanId === p.id ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-gray-900 truncate">{p.name}</span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="font-semibold text-xs text-gray-600">{formatCurrency(p.price)}{CYCLE_LABEL[p.billingCycle]}</span>
                            {selectedPlanId === p.id && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {selectedPlanId && (
                    <div className="form-group">
                      <label className="label">Payment Method</label>
                      <select className="select" value={planPaymentMethod} onChange={e => setPlanPaymentMethod(e.target.value)}>
                        <option value="MANUAL">Manual Payment</option>
                        <option value="CASH">Cash</option>
                        <option value="CARD">Card</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="CHECK">Check</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving…" : editing ? "Save Changes" : "Add Staff"}
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
