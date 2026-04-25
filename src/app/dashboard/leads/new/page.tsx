"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const SOURCES = ["Walk-in", "Website", "Referral", "Social Media", "Google", "Facebook", "Instagram", "Other"];

export default function NewLeadPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    source: "", status: "INQUIRY", notes: "", trialDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) { setError((await res.json()).error ?? "Failed"); setLoading(false); return; }
    const lead = await res.json();
    toast.success("Lead added successfully.");
    router.push(`/dashboard/leads/${lead.id}`);
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <Link href="/dashboard/leads" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-3.5 h-3.5" /> Leads
      </Link>
      <div className="card p-6">
        <h1 className="page-title mb-6">New Lead</h1>
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
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">{loading ? "Adding..." : "Add Lead"}</button>
            <Link href="/dashboard/leads" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
