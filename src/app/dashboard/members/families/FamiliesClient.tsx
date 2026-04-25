"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Pencil, Trash2, X, Save, Loader2, Crown } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";

interface FamilyMember {
  id: string; memberId: string; isPrimary: boolean; relationship: string;
  member: { id: string; firstName: string; lastName: string; status: string; email: string };
}
interface Family { id: string; name: string; members: FamilyMember[]; }

const PALETTE = [
  "from-violet-500 to-purple-600",
  "from-indigo-500 to-blue-600",
  "from-sky-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-600",
  "from-rose-500 to-pink-600",
];

export default function FamiliesClient({ families: initial }: { families: Family[] }) {
  const router = useRouter();
  const toast  = useToast();
  const confirm = useConfirm();
  const [families, setFamilies] = useState(initial);
  const [editFamily, setEditFamily] = useState<Family | null>(null);
  const [editName, setEditName]   = useState("");
  const [saving, setSaving]       = useState(false);

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editFamily) return;
    setSaving(true);
    const res = await fetch(`/api/families/${editFamily.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    });
    setSaving(false);
    if (!res.ok) { toast.error("Failed to update."); return; }
    setFamilies(prev => prev.map(f => f.id === editFamily.id ? { ...f, name: editName } : f));
    setEditFamily(null);
    toast.success("Family updated.");
    router.refresh();
  }

  async function deleteFamily(f: Family) {
    const ok = await confirm({
      title: "Delete Family Plan?",
      message: `"${f.name}" will be permanently deleted. Members will not be deleted.`,
      confirmLabel: "Delete", danger: true,
    });
    if (!ok) return;
    await fetch(`/api/families/${f.id}`, { method: "DELETE" });
    setFamilies(prev => prev.filter(x => x.id !== f.id));
    toast.success("Family plan deleted.");
  }

  if (families.length === 0) {
    return (
      <div className="card">
        <div className="py-16 text-center">
          <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-violet-500" />
          </div>
          <p className="font-semibold text-gray-800 mb-1">No family plans yet</p>
          <p className="text-sm text-gray-400 mb-5">Group members together for shared billing and management</p>
          <Link href="/dashboard/members/families/new" className="btn-primary text-sm">
            Create Family Plan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {families.map((fam, idx) => {
          const gradient = PALETTE[idx % PALETTE.length];
          const primary  = fam.members.find(m => m.isPrimary);
          return (
            <div key={fam.id} className="card overflow-hidden hover:shadow-md transition-shadow">
              {/* Colored header */}
              <div className={`bg-gradient-to-r ${gradient} px-5 py-4 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{fam.name}</h3>
                    <p className="text-xs text-white/70">{fam.members.length} member{fam.members.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => { setEditFamily(fam); setEditName(fam.name); }}
                    className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteFamily(fam)}
                    className="w-8 h-8 rounded-lg bg-white/20 hover:bg-red-500/60 flex items-center justify-center text-white transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Members */}
              <div className="p-4 space-y-2">
                {fam.members.map(fm => (
                  <div key={fm.memberId} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                      {fm.member.firstName.charAt(0)}{fm.member.lastName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/dashboard/members/${fm.member.id}`}
                        className="text-sm font-medium text-gray-800 hover:text-indigo-600 truncate block transition-colors">
                        {fm.member.firstName} {fm.member.lastName}
                      </Link>
                      <p className="text-xs text-gray-400 truncate">{fm.member.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {fm.isPrimary && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                          <Crown className="w-2.5 h-2.5" /> Primary
                        </span>
                      )}
                      <span className={`badge text-[10px] ${fm.member.status === "ACTIVE" ? "badge-green" : "badge-gray"}`}>
                        {fm.member.status.charAt(0) + fm.member.status.slice(1).toLowerCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editFamily && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Edit Family Plan</h2>
              <button onClick={() => setEditFamily(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveEdit} className="px-6 py-5 space-y-4">
              <div className="form-group">
                <label className="label label-required">Family Name</label>
                <input className="input" required value={editName} autoFocus
                  onChange={e => setEditName(e.target.value)} placeholder="e.g. The Smith Family" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving…" : "Save"}
                </button>
                <button type="button" onClick={() => setEditFamily(null)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
