"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Users, Crown, Search, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface Member { id: string; firstName: string; lastName: string; email: string; memberNumber: string; }

const RELATIONSHIPS = [
  { value: "PARENT",         label: "Parent"         },
  { value: "SPOUSE",         label: "Spouse"         },
  { value: "SIBLING",        label: "Sibling"        },
  { value: "FAMILY_MEMBER",  label: "Family Member"  },
  { value: "FRIEND",         label: "Friend"         },
  { value: "LEGAL_GUARDIAN", label: "Legal Guardian" },
  { value: "CARETAKER",      label: "Caretaker"      },
  { value: "OTHER",          label: "Other"          },
];

interface MemberRow {
  rowId: string;
  memberId: string;
  relationship: string;
  search: string;
  open: boolean;
}

function filterMembers(members: Member[], query: string, excludeIds: Set<string>, currentId: string) {
  const q = query.toLowerCase();
  return members
    .filter(m => m.id === currentId || !excludeIds.has(m.id))
    .filter(m =>
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q) ||
      m.memberNumber.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    )
    .slice(0, 6);
}

export default function NewFamilyForm({ members }: { members: Member[] }) {
  const router = useRouter();
  const toast  = useToast();

  const [name,          setName]          = useState("");
  const [primaryId,     setPrimaryId]     = useState("");
  const [primarySearch, setPrimarySearch] = useState("");
  const [showPrimary,   setShowPrimary]   = useState(false);
  const [rows,          setRows]          = useState<MemberRow[]>([]);
  const [saving,        setSaving]        = useState(false);

  const primaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (primaryRef.current && !primaryRef.current.contains(e.target as Node)) {
        setShowPrimary(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedPrimary = members.find(m => m.id === primaryId) ?? null;
  const usedIds = new Set([primaryId, ...rows.map(r => r.memberId).filter(Boolean)]);
  const allUsed = members.every(m => usedIds.has(m.id));

  const filteredPrimary = primarySearch.trim()
    ? members
        .filter(m => !usedIds.has(m.id) || m.id === primaryId)
        .filter(m => {
          const q = primarySearch.toLowerCase();
          return (
            m.firstName.toLowerCase().includes(q) ||
            m.lastName.toLowerCase().includes(q) ||
            m.memberNumber.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q)
          );
        })
        .slice(0, 8)
    : [];

  function addRow() {
    setRows(prev => [...prev, {
      rowId: Math.random().toString(36).slice(2),
      memberId: "",
      relationship: "FAMILY_MEMBER",
      search: "",
      open: false,
    }]);
  }

  function updateRow(rowId: string, updates: Partial<MemberRow>) {
    setRows(prev => prev.map(r => r.rowId === rowId ? { ...r, ...updates } : r));
  }

  function removeRow(rowId: string) {
    setRows(prev => prev.filter(r => r.rowId !== rowId));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Family name is required."); return; }
    if (!primaryId)   { toast.error("Please select a primary member."); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), primaryMemberId: primaryId }),
      });
      if (!res.ok) { toast.error("Failed to create family."); return; }
      const { family } = await res.json();

      for (const row of rows) {
        if (!row.memberId) continue;
        await fetch(`/api/families/${family.id}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: row.memberId, relationship: row.relationship }),
        });
      }

      toast.success("Family plan created!");
      router.push("/dashboard/members/families");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">

      {/* Family name */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">Family Details</h2>
            <p className="text-xs text-gray-400">Give this family account a name</p>
          </div>
        </div>
        <div className="form-group">
          <label className="label label-required">Family Name</label>
          <input className="input" required placeholder="e.g. The Smith Family"
            value={name} onChange={e => setName(e.target.value)} />
        </div>
      </div>

      {/* Primary member */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-yellow-100 flex items-center justify-center">
            <Crown className="w-4 h-4 text-yellow-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">Primary Member</h2>
            <p className="text-xs text-gray-400">The account holder responsible for billing</p>
          </div>
        </div>

        <div className="form-group">
          <label className="label label-required">Select Primary Member</label>
          <div ref={primaryRef} className="relative">
            {selectedPrimary ? (
              <div className="flex items-center justify-between gap-3 p-3 border-2 border-yellow-400 bg-yellow-50 rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-yellow-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-yellow-800">
                    {selectedPrimary.firstName.charAt(0)}{selectedPrimary.lastName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{selectedPrimary.firstName} {selectedPrimary.lastName}</p>
                    <p className="text-xs text-gray-500 truncate">{selectedPrimary.memberNumber} · {selectedPrimary.email}</p>
                  </div>
                </div>
                <button type="button" onClick={() => { setPrimaryId(""); setPrimarySearch(""); }}
                  className="text-gray-400 hover:text-red-500 flex-shrink-0 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input className="input pl-9" placeholder="Search by name, member #, or email…"
                    value={primarySearch}
                    onChange={e => { setPrimarySearch(e.target.value); setShowPrimary(true); }}
                    onFocus={() => setShowPrimary(true)} />
                </div>
                {showPrimary && primarySearch.trim() && (
                  <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {filteredPrimary.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-400">No members found</p>
                    ) : filteredPrimary.map(m => (
                      <button key={m.id} type="button"
                        onMouseDown={() => { setPrimaryId(m.id); setPrimarySearch(""); setShowPrimary(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-yellow-50 text-left transition-colors border-b border-gray-50 last:border-0">
                        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-yellow-700">
                          {m.firstName.charAt(0)}{m.lastName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{m.firstName} {m.lastName}</p>
                          <p className="text-xs text-gray-500 truncate">{m.memberNumber} · {m.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          {!selectedPrimary && (
            <p className="form-hint mt-1">Type a name, member number, or email to search</p>
          )}
        </div>
      </div>

      {/* Additional members */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">Additional Members</h2>
              <p className="text-xs text-gray-400">Add more members to this family (optional)</p>
            </div>
          </div>
          <button type="button" onClick={addRow} disabled={allUsed} className="btn-secondary text-xs">
            <Plus className="w-3.5 h-3.5" /> Add Member
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No additional members added yet</p>
        ) : (
          <div className="space-y-3">
            {rows.map(row => {
              const sel = members.find(m => m.id === row.memberId) ?? null;
              const filtered = row.search.trim()
                ? filterMembers(members, row.search, usedIds, row.memberId)
                : [];

              return (
                <div key={row.rowId} className="bg-gray-50 rounded-xl p-3 space-y-2.5">
                  {/* Member search */}
                  <div className="relative">
                    {sel ? (
                      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-2 border-indigo-300 bg-indigo-50 rounded-xl">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-indigo-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-800">
                            {sel.firstName.charAt(0)}{sel.lastName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{sel.firstName} {sel.lastName}</p>
                            <p className="text-xs text-gray-500 truncate">{sel.memberNumber} · {sel.email}</p>
                          </div>
                        </div>
                        <button type="button"
                          onClick={() => updateRow(row.rowId, { memberId: "", search: "", open: false })}
                          className="text-gray-400 hover:text-red-500 flex-shrink-0 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <input
                            className="input pl-9 text-sm"
                            placeholder="Search member by name, # or email…"
                            value={row.search}
                            onChange={e => updateRow(row.rowId, { search: e.target.value, open: true })}
                            onFocus={() => updateRow(row.rowId, { open: true })}
                            onBlur={() => setTimeout(() => updateRow(row.rowId, { open: false }), 150)}
                          />
                        </div>
                        {row.open && row.search.trim() && (
                          <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                            {filtered.length === 0 ? (
                              <p className="px-4 py-3 text-sm text-gray-400">No members found</p>
                            ) : filtered.map(m => (
                              <button key={m.id} type="button"
                                onMouseDown={() => updateRow(row.rowId, { memberId: m.id, search: "", open: false })}
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 text-left transition-colors border-b border-gray-50 last:border-0">
                                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-700">
                                  {m.firstName.charAt(0)}{m.lastName.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{m.firstName} {m.lastName}</p>
                                  <p className="text-xs text-gray-500 truncate">{m.memberNumber} · {m.email}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Relationship + Remove */}
                  <div className="flex gap-2 items-center">
                    <select className="select text-sm flex-1" value={row.relationship}
                      onChange={e => updateRow(row.rowId, { relationship: e.target.value })}>
                      {RELATIONSHIPS.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => removeRow(row.rowId)}
                      className="text-gray-400 hover:text-red-500 flex-shrink-0 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center py-2.5">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : "Create Family Plan"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary px-5">Cancel</button>
      </div>
    </form>
  );
}
