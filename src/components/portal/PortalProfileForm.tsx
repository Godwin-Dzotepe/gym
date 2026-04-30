"use client";

import { useState } from "react";
import { Save, Loader2, Key, CheckCircle2, AlertCircle } from "lucide-react";
import PasswordInput from "@/components/ui/PasswordInput";

export default function PortalProfileForm({ member }: { member: any }) {
  const [loading, setLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [form, setForm] = useState({
    firstName: member?.firstName ?? "",
    lastName: member?.lastName ?? "",
    phone: member?.phone ?? "",
    address: member?.address ?? "",
    emergencyName: member?.emergencyName ?? "",
    emergencyPhone: member?.emergencyPhone ?? "",
  });
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  async function saveProfile() {
    setLoading(true);
    setProfileMsg(null);
    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setProfileMsg({ ok: false, text: d.error ?? "Failed to save. Please try again." });
      } else {
        setProfileMsg({ ok: true, text: "Profile updated successfully." });
        setTimeout(() => setProfileMsg(null), 4000);
      }
    } catch {
      setProfileMsg({ ok: false, text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  async function changePassword() {
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ ok: false, text: "Passwords do not match." });
      return;
    }
    if (pwForm.next.length < 8) {
      setPwMsg({ ok: false, text: "Password must be at least 8 characters." });
      return;
    }
    setPwMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current: pwForm.current, next: pwForm.next }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setPwMsg({ ok: false, text: d.error ?? "Failed to update password." });
      } else {
        setPwForm({ current: "", next: "", confirm: "" });
        setPwMsg({ ok: true, text: "Password updated successfully." });
        setTimeout(() => setPwMsg(null), 4000);
      }
    } catch {
      setPwMsg({ ok: false, text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <h3 className="section-title mb-5 pb-3 border-b border-slate-100">Personal Information</h3>

        {profileMsg && (
          <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
            profileMsg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}>
            {profileMsg.ok
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />
            }
            {profileMsg.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label">First Name</label>
            <input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className="input" />
          </div>
          <div className="form-group">
            <label className="label">Last Name</label>
            <input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className="input" />
          </div>
          <div className="form-group sm:col-span-2">
            <label className="label">Phone</label>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="input" />
          </div>
          <div className="form-group sm:col-span-2">
            <label className="label">Address</label>
            <input value={form.address} onChange={(e) => set("address", e.target.value)} className="input" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Emergency Contact</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Name</label>
              <input value={form.emergencyName} onChange={(e) => set("emergencyName", e.target.value)} className="input" />
            </div>
            <div className="form-group">
              <label className="label">Phone</label>
              <input value={form.emergencyPhone} onChange={(e) => set("emergencyPhone", e.target.value)} className="input" />
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={saveProfile} disabled={loading} className="btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile
          </button>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
          <Key className="w-4 h-4 text-slate-400" />
          <h3 className="section-title">Change Password</h3>
        </div>

        {pwMsg && (
          <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
            pwMsg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}>
            {pwMsg.ok
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />
            }
            {pwMsg.text}
          </div>
        )}

        <div className="space-y-3 max-w-sm">
          <div className="form-group">
            <label className="label">Current Password</label>
            <PasswordInput value={pwForm.current}
              onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))} className="input" />
          </div>
          <div className="form-group">
            <label className="label">New Password</label>
            <PasswordInput value={pwForm.next}
              onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))} className="input" />
          </div>
          <div className="form-group">
            <label className="label">Confirm New Password</label>
            <PasswordInput value={pwForm.confirm}
              onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))} className="input" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={changePassword} disabled={loading || !pwForm.current || !pwForm.next} className="btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}
