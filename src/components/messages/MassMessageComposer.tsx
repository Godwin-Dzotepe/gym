"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";

const SEGMENTS = [
  { value: "ALL_ACTIVE", label: "All Active Members" },
  { value: "ALL_MEMBERS", label: "All Members (including frozen)" },
  { value: "UNPAID", label: "Members with Unpaid Invoices" },
  { value: "FROZEN", label: "Frozen Members" },
  { value: "EXPIRING_7D", label: "Plans Expiring in 7 Days" },
  { value: "PENDING", label: "Pending Registrations" },
];

export default function MassMessageComposer({ memberCount }: { memberCount: number }) {
  const [form, setForm] = useState({ segment: "ALL_ACTIVE", type: "EMAIL", subject: "", body: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function send() {
    if (!form.body.trim()) return;
    setLoading(true);
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setSent(true);
    setForm((p) => ({ ...p, subject: "", body: "" }));
    setTimeout(() => setSent(false), 4000);
  }

  return (
    <div className="card p-5 space-y-4">
      <h2 className="section-title">Compose Message</h2>

      {sent && (
        <div className="alert alert-success flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <p className="text-sm text-emerald-700">Message sent successfully!</p>
        </div>
      )}

      <div className="form-group">
        <label className="label">Send To</label>
        <select value={form.segment} onChange={(e) => setForm((p) => ({ ...p, segment: e.target.value }))} className="select">
          {SEGMENTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="label">Channel</label>
        <div className="flex gap-2">
          {["EMAIL", "SMS"].map((t) => (
            <button key={t} onClick={() => setForm((p) => ({ ...p, type: t }))}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                form.type === t ? "bg-sky-500 text-white border-sky-500" : "bg-white text-slate-600 border-slate-200"
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {form.type === "EMAIL" && (
        <div className="form-group">
          <label className="label">Subject</label>
          <input value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
            className="input" placeholder="Important update from QYM" />
        </div>
      )}

      <div className="form-group">
        <label className="label label-required">Message</label>
        <textarea value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
          rows={5} className="input resize-none"
          placeholder="Write your message here..." />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">~{memberCount} recipients</p>
        <button onClick={send} disabled={loading || !form.body.trim()} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send Message
        </button>
      </div>
    </div>
  );
}
