"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, X, Search, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface MemberOption { id: string; name: string; memberNumber: string; }

export default function ManualCheckin() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemberOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<MemberOption | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/members?search=${encodeURIComponent(query)}&limit=8`);
      const data = await res.json();
      setResults((data.members ?? []).map((m: { id: string; firstName: string; lastName: string; memberNumber: string }) => ({
        id: m.id, name: `${m.firstName} ${m.lastName}`, memberNumber: m.memberNumber,
      })));
      setSearching(false);
    }, 300);
  }, [query]);

  async function checkin() {
    if (!selected) return;
    setSaving(true);
    const res = await fetch("/api/kiosk/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: selected.id, method: "MANUAL" }),
    });
    setSaving(false);
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Check-in failed.");
      return;
    }
    toast.success(`${selected.name} checked in successfully.`);
    setOpen(false); setQuery(""); setSelected(null); setResults([]);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary">
        <UserCheck className="w-4 h-4" /> Manual Check-in
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-500" />
                <h2 className="font-semibold text-gray-900">Manual Check-in</h2>
              </div>
              <button onClick={() => { setOpen(false); setQuery(""); setSelected(null); setResults([]); }}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {!selected ? (
                <div className="space-y-2">
                  <label className="label">Search Member</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      autoFocus
                      className="input pl-9"
                      placeholder="Name or member number…"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                    />
                    {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
                  </div>
                  {results.length > 0 && (
                    <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                      {results.map(m => (
                        <button key={m.id} onClick={() => { setSelected(m); setQuery(""); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 flex items-center gap-3 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                            {m.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{m.name}</p>
                            <p className="text-xs text-gray-400">{m.memberNumber}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">
                      {selected.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{selected.name}</p>
                      <p className="text-xs text-gray-500">{selected.memberNumber}</p>
                    </div>
                    <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={checkin} disabled={saving} className="btn-primary w-full justify-center">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                    {saving ? "Checking in…" : "Check In Now"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
