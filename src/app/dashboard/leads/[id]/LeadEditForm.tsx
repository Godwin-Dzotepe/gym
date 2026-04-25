"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";

const SOURCES = ["Walk-in", "Website", "Referral", "Social Media", "Google", "Facebook", "Instagram", "Other"];

export default function LeadEditForm({ lead }: { lead: any }) {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: lead.firstName ?? "",
    lastName: lead.lastName ?? "",
    email: lead.email ?? "",
    phone: lead.phone ?? "",
    source: lead.source ?? "",
    status: lead.status ?? "INQUIRY",
    notes: lead.notes ?? "",
    trialDate: lead.trialDate ? new Date(lead.trialDate).toISOString().slice(0, 10) : "",
    activityNote: "",
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  const confirm = useConfirm();
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) { setError((await res.json()).error ?? "Failed"); setLoading(false); return; }
    setLoading(false);
    set("activityNote", "");
    toast.success("Lead saved successfully.");
    router.refresh();
  }

  async function deleteLead() {
    const ok = await confirm({
      title: "Delete Lead?",
      message: `This will permanently delete ${lead.firstName} ${lead.lastName} and all their activity. This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setDeleting(true);
    await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
    toast.success("Lead deleted.");
    router.push("/dashboard/leads");
  }

  return (
    <>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label label-required">First Name</label>
            <input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className="input" required />
          </div>
          <div className="form-group">
            <label className="label label-required">Last Name</label>
            <input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className="input" required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label label-required">Email</label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="input" required />
          </div>
          <div className="form-group">
            <label className="label">Phone</label>
            <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="input" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label">Source</label>
            <select value={form.source} onChange={(e) => set("source", e.target.value)} className="select">
              <option value="">Unknown</option>
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Status</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className="select">
              <option value="INQUIRY">Inquiry</option>
              <option value="CONTACTED">Contacted</option>
              <option value="TRIAL">Trial</option>
              <option value="NEGOTIATING">Negotiating</option>
              <option value="CONVERTED">Converted</option>
              <option value="LOST">Lost</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="label">Trial Date</label>
          <input type="date" value={form.trialDate} onChange={(e) => set("trialDate", e.target.value)} className="input" />
        </div>
        <div className="form-group">
          <label className="label">Notes</label>
          <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className="input resize-none" />
        </div>
        <div className="form-group">
          <label className="label">Activity Note <span className="font-normal text-slate-400">(optional — logged on save)</span></label>
          <input value={form.activityNote} onChange={(e) => set("activityNote", e.target.value)} className="input" placeholder="e.g. Called and left voicemail" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary">{loading ? "Saving…" : "Save Changes"}</button>
            <Link href="/dashboard/leads" className="btn-secondary">Cancel</Link>
          </div>

          <button type="button" onClick={deleteLead} disabled={deleting}
            className="btn-ghost text-red-500 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="w-4 h-4" /> {deleting ? "Deleting…" : "Delete Lead"}
          </button>
        </div>
      </form>
    </>
  );
}
