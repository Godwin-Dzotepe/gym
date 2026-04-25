"use client";

import { useState } from "react";
import { Users, Plus, X, Crown, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FamilyMemberRow {
  id: string;
  memberId: string;
  memberId2?: string;
  isPrimary: boolean;
  relationship: string;
  name: string;
  status: string;
}

interface FamilyData {
  id: string;
  name: string;
  members: FamilyMemberRow[];
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  PARENT: "Parent", SPOUSE: "Spouse / Significant Other", SIBLING: "Sibling",
  FAMILY_MEMBER: "Family member", FRIEND: "Friend", LEGAL_GUARDIAN: "Legal guardian",
  CARETAKER: "Caretaker", OTHER: "Other",
};

interface Props {
  memberId: string;
  lastName: string;
  isPrimary: boolean;
  activePlanId?: string;
  family: FamilyData | null;
}

export default function MemberFamilyAccount({ memberId, lastName, isPrimary, activePlanId, family }: Props) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [familyName, setFamilyName] = useState(`The ${lastName} Family`);

  const createFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    await fetch("/api/families", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: familyName, primaryMemberId: memberId }),
    });
    setCreating(false);
    setShowCreate(false);
    router.refresh();
  };

  const addNewFamilyMember = () => {
    if (!family) return;
    const params = new URLSearchParams({
      familyId: family.id,
      lastName: lastName,
      ...(activePlanId ? { planId: activePlanId } : {}),
    });
    router.push(`/dashboard/members/new?${params.toString()}`);
  };

  // Sub-member view: show who the primary is
  if (family && !isPrimary) {
    const primary = family.members.find(m => m.isPrimary);
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-5 shadow-sm">
        <Users className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-10 pointer-events-none" strokeWidth={1} />
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-semibold text-white">Family Account</h2>
          </div>
          <Link href="/dashboard/members/families" className="text-xs text-white/70 hover:text-white font-medium">
            View All
          </Link>
        </div>
        <p className="text-sm font-semibold text-white mb-3">{family.name}</p>
        {primary && (
          <div className="bg-yellow-400/20 rounded-xl px-3 py-2 mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-yellow-200 font-semibold uppercase tracking-wider mb-0.5">Primary Account</p>
              <Link href={`/dashboard/members/${primary.memberId}`} className="text-sm font-bold text-white hover:underline flex items-center gap-1">
                {primary.name} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <Crown className="w-5 h-5 text-yellow-300" />
          </div>
        )}
        <div className="bg-white/10 rounded-xl px-3 py-2">
          <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wider mb-1">Billing</p>
          <p className="text-xs text-white/80">This member is covered by the primary account holder's plan.</p>
        </div>
      </div>
    );
  }

  // No family yet
  if (!family) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-5 shadow-sm">
        <Users className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-10 pointer-events-none" strokeWidth={1} />
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-semibold text-white">Family Account</h2>
        </div>
        <button onClick={() => { setFamilyName(`The ${lastName} Family`); setShowCreate(true); }}
          className="w-full border-2 border-dashed border-white/30 rounded-xl p-4 text-center hover:border-white/60 hover:bg-white/10 transition-all">
          <Plus className="w-5 h-5 text-white/70 mx-auto mb-1" />
          <p className="text-sm font-medium text-white">Create Family Account</p>
          <p className="text-xs text-white/60">Make this member the primary account holder</p>
        </button>

        {showCreate && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Create Family Account</h2>
                <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <form onSubmit={createFamily} className="px-6 py-5 space-y-4">
                <div>
                  <label className="label">Family Name</label>
                  <input className="input" placeholder="e.g. The Mensah Family" required
                    value={familyName} onChange={e => setFamilyName(e.target.value)} />
                </div>
                <p className="text-xs text-gray-400">This member will be set as the primary account holder. Family members share their plan.</p>
                <button type="submit" disabled={creating} className="btn-primary w-full justify-center">
                  {creating ? "Creating…" : "Create Family Account"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Primary member view
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-5 shadow-sm">
      <Users className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-10 pointer-events-none" strokeWidth={1} />
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-semibold text-white">Family Account</h2>
        </div>
        <Link href="/dashboard/members/families" className="text-xs text-white/70 hover:text-white font-medium">
          Manage
        </Link>
      </div>

      <p className="text-sm font-semibold text-white mb-3">{family.name}</p>

      <div className="space-y-2 mb-3">
        {family.members.map(fm => (
          <div key={fm.id} className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
                {fm.name.charAt(0)}
              </div>
              <div>
                <Link href={`/dashboard/members/${fm.memberId}`} className="text-sm text-white font-medium hover:underline">
                  {fm.name}
                </Link>
                {fm.isPrimary && <span className="ml-1.5 text-[10px] bg-yellow-400/30 text-yellow-200 px-1.5 py-0.5 rounded-full font-medium">Primary</span>}
              </div>
            </div>
            <span className="text-xs text-white/60">{RELATIONSHIP_LABELS[fm.relationship] ?? fm.relationship}</span>
          </div>
        ))}
      </div>

      <button onClick={addNewFamilyMember}
        className="w-full flex items-center justify-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl py-2.5 text-sm font-medium text-white transition-all">
        <Plus className="w-3.5 h-3.5" /> Add Family Member
      </button>
    </div>
  );
}
