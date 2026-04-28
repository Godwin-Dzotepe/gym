"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Users, Crown } from "lucide-react";
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

interface AddedMember { memberId: string; relationship: string; }

export default function NewFamilyForm({ members }: { members: Member[] }) {
  const router = useRouter();
  const toast  = useToast();

  const [name,        setName]        = useState("");
  const [primaryId,   setPrimaryId]   = useState("");
  const [added,       setAdded]       = useState<AddedMember[]>([]);
  const [saving,      setSaving]      = useState(false);

  const usedIds = new Set([primaryId, ...added.map(a => a.memberId)]);
  const available = members.filter(m => !usedIds.has(m.id));

  function addMember() {
    const first = available[0];
    if (!first) return;
    setAdded(prev => [...prev, { memberId: first.id, relationship: "FAMILY_MEMBER" }]);
  }

  function updateAdded(idx: number, field: keyof AddedMember, value: string) {
    setAdded(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  }

  function removeAdded(idx: number) {
    setAdded(prev => prev.filter((_, i) => i !== idx));
  }

  function memberLabel(id: string) {
    const m = members.find(x => x.id === id);
    return m ? `${m.firstName} ${m.lastName} (${m.memberNumber})` : "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim())    { toast.error("Family name is required."); return; }
    if (!primaryId)      { toast.error("Please select a primary member."); return; }

    setSaving(true);
    try {
      // 1. Create family with primary member
      const res = await fetch("/api/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), primaryMemberId: primaryId }),
      });
      if (!res.ok) { toast.error("Failed to create family."); return; }
      const { family } = await res.json();

      // 2. Add additional members
      for (const a of added) {
        if (!a.memberId) continue;
        await fetch(`/api/families/${family.id}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: a.memberId, relationship: a.relationship }),
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
          <input
            className="input"
            required
            placeholder="e.g. The Smith Family"
            value={name}
            onChange={e => setName(e.target.value)}
          />
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
          <select
            className="select"
            required
            value={primaryId}
            onChange={e => setPrimaryId(e.target.value)}
          >
            <option value="">— Choose a member —</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>
                {m.firstName} {m.lastName} — {m.memberNumber} ({m.email})
              </option>
            ))}
          </select>
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
          <button
            type="button"
            onClick={addMember}
            disabled={available.length === 0}
            className="btn-secondary text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Member
          </button>
        </div>

        {added.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No additional members added yet</p>
        ) : (
          <div className="space-y-3">
            {added.map((a, idx) => {
              const rowAvailable = members.filter(m => m.id === a.memberId || !usedIds.has(m.id) || !added.some((x, i) => i !== idx && x.memberId === m.id));
              return (
                <div key={idx} className="flex gap-3 items-start bg-gray-50 rounded-xl p-3">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      className="select text-sm"
                      value={a.memberId}
                      onChange={e => updateAdded(idx, "memberId", e.target.value)}
                    >
                      {rowAvailable.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.firstName} {m.lastName} ({m.memberNumber})
                        </option>
                      ))}
                    </select>
                    <select
                      className="select text-sm"
                      value={a.relationship}
                      onChange={e => updateAdded(idx, "relationship", e.target.value)}
                    >
                      {RELATIONSHIPS.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <button type="button" onClick={() => removeAdded(idx)}
                    className="text-gray-400 hover:text-red-500 mt-1 flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
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
