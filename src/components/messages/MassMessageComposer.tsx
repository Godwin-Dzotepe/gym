"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, CheckCircle2, AlertCircle, Search, X } from "lucide-react";

const SEGMENTS = [
  { value: "ALL_ACTIVE",       label: "All Active Members" },
  { value: "ALL_MEMBERS",      label: "All Members (including frozen)" },
  { value: "UNPAID",           label: "Members with Unpaid Invoices" },
  { value: "FROZEN",           label: "Frozen Members" },
  { value: "EXPIRING_7D",      label: "Plans Expiring in 7 Days" },
  { value: "PENDING",          label: "Pending Registrations" },
  { value: "SPECIFIC_MEMBER",  label: "Specific Member…" },
];

type MemberHit = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
};

export default function MassMessageComposer({ memberCount }: { memberCount: number }) {
  const [form, setForm]       = useState({ segment: "ALL_ACTIVE", type: "EMAIL", subject: "", body: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  const [selectedMember, setSelectedMember] = useState<MemberHit | null>(null);
  const [memberSearch, setMemberSearch]     = useState("");
  const [memberResults, setMemberResults]   = useState<MemberHit[]>([]);
  const [searchLoading, setSearchLoading]   = useState(false);
  const [showDropdown, setShowDropdown]     = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced member search
  useEffect(() => {
    if (form.segment !== "SPECIFIC_MEMBER" || !memberSearch.trim()) {
      setMemberResults([]);
      setShowDropdown(false);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/members?search=${encodeURIComponent(memberSearch)}&limit=8`);
        const data = await res.json();
        setMemberResults(data.members ?? []);
        setShowDropdown(true);
      } catch {
        setMemberResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [memberSearch, form.segment]);

  // Close dropdown on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // Reset member selection when segment changes away
  useEffect(() => {
    setSelectedMember(null);
    setMemberSearch("");
    setMemberResults([]);
    setShowDropdown(false);
  }, [form.segment]);

  async function send() {
    if (!form.body.trim()) return;
    if (form.segment === "SPECIFIC_MEMBER" && !selectedMember) {
      setError("Please search and select a member first.");
      return;
    }
    setLoading(true);
    setSent(false);
    setError("");
    try {
      const res  = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, memberId: selectedMember?.id }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) { setError(data.error ?? "Failed to send message"); return; }
      if (data.deliveryStatus !== "ok") { setError(data.deliveryError ?? "Message saved but delivery failed"); return; }
      setSent(true);
      setForm(p => ({ ...p, subject: "", body: "" }));
      setSelectedMember(null);
      setMemberSearch("");
      window.dispatchEvent(new Event("message-sent"));
      setTimeout(() => setSent(false), 5000);
    } catch (e: any) {
      setLoading(false);
      setError(e.message ?? "Network error");
    }
  }

  const isSpecific = form.segment === "SPECIFIC_MEMBER";

  return (
    <div className="card p-5 space-y-4">
      <h2 className="section-title">Compose Message</h2>

      {sent && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <p>Message sent successfully!</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Segment */}
      <div className="form-group">
        <label className="label">Send To</label>
        <select value={form.segment} onChange={e => setForm(p => ({ ...p, segment: e.target.value }))} className="select">
          {SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Member search — only for SPECIFIC_MEMBER */}
      {isSpecific && (
        <div ref={searchRef} className="relative">
          {selectedMember ? (
            <div className="flex items-center gap-3 border border-sky-200 rounded-xl px-4 py-3 bg-sky-50">
              <div className="w-8 h-8 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {selectedMember.firstName[0]}{selectedMember.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {selectedMember.firstName} {selectedMember.lastName}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {selectedMember.email}{selectedMember.phone ? ` · ${selectedMember.phone}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedMember(null); setMemberSearch(""); }}
                className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  className="input pl-9"
                  placeholder="Search by name, email or member number…"
                  value={memberSearch}
                  onChange={e => { setMemberSearch(e.target.value); setShowDropdown(true); }}
                  onFocus={() => memberResults.length > 0 && setShowDropdown(true)}
                  autoComplete="off"
                />
                {searchLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                )}
              </div>

              {showDropdown && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                  {memberResults.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">No members found</p>
                  ) : (
                    <ul className="divide-y divide-slate-50">
                      {memberResults.map(m => (
                        <li key={m.id}>
                          <button
                            type="button"
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors"
                            onMouseDown={() => { setSelectedMember(m); setMemberSearch(""); setShowDropdown(false); }}>
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                              {m.firstName[0]}{m.lastName[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800">{m.firstName} {m.lastName}</p>
                              <p className="text-xs text-slate-400 truncate">
                                {m.email}{m.phone ? ` · ${m.phone}` : ""}
                              </p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Channel */}
      <div className="form-group">
        <label className="label">Channel</label>
        <div className="flex gap-2">
          {["EMAIL", "SMS"].map(t => (
            <button key={t} type="button"
              onClick={() => setForm(p => ({ ...p, type: t }))}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                form.type === t
                  ? "bg-sky-500 text-white border-sky-500"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {form.type === "EMAIL" && (
        <div className="form-group">
          <label className="label">Subject</label>
          <input
            value={form.subject}
            onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
            className="input"
            placeholder="Important update from Oracle Gym" />
        </div>
      )}

      <div className="form-group">
        <label className="label label-required">Message</label>
        <textarea
          value={form.body}
          onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
          rows={5}
          className="input resize-none"
          placeholder="Write your message here..." />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {isSpecific
            ? selectedMember
              ? `To: ${selectedMember.firstName} ${selectedMember.lastName}`
              : "No member selected"
            : `~${memberCount} recipients`
          }
        </p>
        <button
          onClick={send}
          disabled={loading || !form.body.trim() || (isSpecific && !selectedMember)}
          className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send Message
        </button>
      </div>
    </div>
  );
}
