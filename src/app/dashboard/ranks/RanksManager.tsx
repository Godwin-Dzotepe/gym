"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Plus, Pencil, Trash2, X, Save, Loader2, Trophy, Star, Users, Award, TrendingUp, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import Link from "next/link";

interface Rank { id: string; name: string; color: string | null; order: number; sessionsRequired: number | null; monthsRequired: number | null; description: string | null; memberCount: number; }
interface Promotion { id: string; awardedAt: string; notes: string; memberName: string; memberId: string; rankName: string; rankColor: string; }
interface Member { id: string; name: string; memberNumber: string; currentRank: { name: string; color: string } | null; }
interface Suggestion { memberId: string; memberName: string; memberNumber: string; currentRankName: string | null; nextRankId: string; nextRankName: string; nextRankColor: string; sessionsHave: number; sessionsNeed: number | null; monthsHave: number; monthsNeed: number | null; }

const COLORS = ["#ef4444","#f97316","#eab308","#22c55e","#06b6d4","#6366f1","#8b5cf6","#ec4899","#1e293b","#ffffff"];

export default function RanksManager({ ranks: initial, promotions, members, suggestions }: { ranks: Rank[]; promotions: Promotion[]; members: Member[]; suggestions: Suggestion[] }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [ranks, setRanks] = useState(initial);
  const [showRankModal, setShowRankModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [editingRank, setEditingRank] = useState<Rank | null>(null);
  const [rankForm, setRankForm] = useState({ name: "", color: "#6366f1", order: 0, sessionsRequired: "", monthsRequired: "", description: "" });
  const [promoteForm, setPromoteForm] = useState({ memberId: "", rankId: "", notes: "" });
  const [saving, setSaving] = useState(false);

  function openAddRank() { setEditingRank(null); setRankForm({ name: "", color: "#6366f1", order: ranks.length, sessionsRequired: "", monthsRequired: "", description: "" }); setShowRankModal(true); }
  function openEditRank(r: Rank) { setEditingRank(r); setRankForm({ name: r.name, color: r.color ?? "#6366f1", order: r.order, sessionsRequired: r.sessionsRequired?.toString() ?? "", monthsRequired: r.monthsRequired?.toString() ?? "", description: r.description ?? "" }); setShowRankModal(true); }

  async function saveRank(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const body = { ...rankForm, sessionsRequired: rankForm.sessionsRequired ? parseInt(rankForm.sessionsRequired) : null, monthsRequired: rankForm.monthsRequired ? parseInt(rankForm.monthsRequired) : null };
    if (editingRank) {
      await fetch(`/api/ranks/${editingRank.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      toast.success("Rank updated.");
    } else {
      await fetch("/api/ranks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      toast.success("Rank created.");
    }
    setSaving(false); setShowRankModal(false); router.refresh();
  }

  async function deleteRank(r: Rank) {
    const ok = await confirm({ title: "Delete Rank?", message: `"${r.name}" will be permanently deleted. Members with this rank will lose it.`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    await fetch(`/api/ranks/${r.id}`, { method: "DELETE" });
    toast.success("Rank deleted."); router.refresh();
  }

  async function promote(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/ranks/promote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(promoteForm) });
    setSaving(false);
    if (!res.ok) { toast.error("Failed to promote."); return; }
    toast.success("Member promoted successfully!"); setShowPromoteModal(false); router.refresh();
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Belt Ranks */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-500" /><h2 className="section-title">Belt Ranks</h2></div>
            <button onClick={openAddRank} className="btn-primary text-xs py-1.5 px-3"><Plus className="w-3.5 h-3.5" /> Add Rank</button>
          </div>
          <div className="divide-y divide-gray-50">
            {ranks.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Trophy className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No ranks yet.</p>
                <button onClick={openAddRank} className="btn-primary text-xs mt-3"><Plus className="w-3.5 h-3.5" /> Add First Rank</button>
              </div>
            ) : ranks.map((rank, i) => (
              <div key={rank.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 group">
                <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex-shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: rank.color ?? "#e2e8f0", color: rank.color === "#ffffff" ? "#1e293b" : "white" }}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{rank.name}</p>
                  <p className="text-xs text-gray-400">
                    {[rank.sessionsRequired && `${rank.sessionsRequired} sessions`, rank.monthsRequired && `${rank.monthsRequired} months`].filter(Boolean).join(" · ") || "No requirements"}
                  </p>
                </div>
                <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mr-1">{rank.memberCount}</span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditRank(rank)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"><Pencil className="w-3 h-3" /></button>
                  <button onClick={() => deleteRank(rank)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Promotions */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2"><Star className="w-4 h-4 text-orange-400" /><h2 className="section-title">Recent Promotions</h2></div>
            <button onClick={() => setShowPromoteModal(true)} className="btn-primary text-xs py-1.5 px-3"><Award className="w-3.5 h-3.5" /> Promote</button>
          </div>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {promotions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No promotions yet</p>
            ) : promotions.map((p) => (
              <div key={p.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
                <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex-shrink-0" style={{ backgroundColor: p.rankColor }} />
                <div className="flex-1 min-w-0">
                  <Link href={`/dashboard/members/${p.memberId}`} className="text-sm font-semibold text-gray-800 hover:text-indigo-600 truncate block">{p.memberName}</Link>
                  <p className="text-xs text-gray-400">{p.rankName}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(p.awardedAt, "MMM d")}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Members with ranks */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-500" /><h2 className="section-title">Member Ranks</h2>
          </div>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {members.map((m) => (
              <Link key={m.id} href={`/dashboard/members/${m.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 group">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: m.currentRank?.color ?? "#e2e8f0", color: m.currentRank?.color === "#ffffff" ? "#1e293b" : "white" }}>
                  {m.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-indigo-600">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.currentRank?.name ?? "No rank"}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Promotion Suggestions */}
      {suggestions.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h2 className="section-title">Promotion Suggestions</h2>
            <span className="ml-auto text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{suggestions.length} eligible</span>
          </div>
          <div className="divide-y divide-gray-50">
            {suggestions.map((s) => (
              <div key={s.memberId} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                <div className="w-9 h-9 rounded-full border-2 border-white shadow-sm flex-shrink-0 flex items-center justify-center font-bold text-xs"
                  style={{ backgroundColor: s.nextRankColor, color: s.nextRankColor === "#ffffff" ? "#1e293b" : "white" }}>
                  {s.memberName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{s.memberName}</p>
                  <p className="text-xs text-gray-400">
                    {s.currentRankName ?? "No rank"} <ChevronRight className="inline w-3 h-3" /> <span style={{ color: s.nextRankColor === "#ffffff" ? "#94a3b8" : s.nextRankColor }}>{s.nextRankName}</span>
                    {" · "}
                    {s.sessionsNeed !== null && <span>{s.sessionsHave}/{s.sessionsNeed} sessions</span>}
                    {s.sessionsNeed !== null && s.monthsNeed !== null && " · "}
                    {s.monthsNeed !== null && <span>{s.monthsHave}/{s.monthsNeed} months</span>}
                  </p>
                </div>
                <button
                  className="btn-primary text-xs py-1.5 px-3"
                  onClick={() => { setPromoteForm({ memberId: s.memberId, rankId: s.nextRankId, notes: "" }); setShowPromoteModal(true); }}>
                  <Award className="w-3 h-3" /> Promote
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rank Modal */}
      {showRankModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editingRank ? "Edit Rank" : "Add Belt Rank"}</h2>
              <button onClick={() => setShowRankModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={saveRank} className="px-6 py-5 space-y-4">
              <div className="form-group"><label className="label label-required">Rank Name</label>
                <input className="input" required value={rankForm.name} onChange={e => setRankForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Blue Belt" /></div>
              <div className="form-group">
                <label className="label">Color</label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setRankForm(p => ({ ...p, color: c }))}
                      className={`w-8 h-8 rounded-full border-4 transition-all ${rankForm.color === c ? "border-indigo-500 scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                  <input type="color" value={rankForm.color} onChange={e => setRankForm(p => ({ ...p, color: e.target.value }))} className="w-8 h-8 rounded-full cursor-pointer border-0 p-0" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="form-group"><label className="label">Order</label>
                  <input className="input" type="number" min="0" value={rankForm.order} onChange={e => setRankForm(p => ({ ...p, order: parseInt(e.target.value) }))} /></div>
                <div className="form-group"><label className="label">Sessions</label>
                  <input className="input" type="number" min="0" value={rankForm.sessionsRequired} onChange={e => setRankForm(p => ({ ...p, sessionsRequired: e.target.value }))} placeholder="Required" /></div>
                <div className="form-group"><label className="label">Months</label>
                  <input className="input" type="number" min="0" value={rankForm.monthsRequired} onChange={e => setRankForm(p => ({ ...p, monthsRequired: e.target.value }))} placeholder="Required" /></div>
              </div>
              <div className="form-group"><label className="label">Description</label>
                <textarea className="input resize-none" rows={2} value={rankForm.description} onChange={e => setRankForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="flex gap-3"><button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving…" : editingRank ? "Save Changes" : "Create Rank"}
              </button><button type="button" onClick={() => setShowRankModal(false)} className="btn-secondary">Cancel</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Promote Modal */}
      {showPromoteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2"><Award className="w-4 h-4 text-yellow-500" /><h2 className="font-semibold text-gray-900">Award Promotion</h2></div>
              <button onClick={() => setShowPromoteModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={promote} className="px-6 py-5 space-y-4">
              <div className="form-group"><label className="label label-required">Member</label>
                <select className="select" required value={promoteForm.memberId} onChange={e => setPromoteForm(p => ({ ...p, memberId: e.target.value }))}>
                  <option value="">Select member…</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name} — {m.currentRank?.name ?? "No rank"}</option>)}
                </select></div>
              <div className="form-group"><label className="label label-required">Promote to Rank</label>
                <select className="select" required value={promoteForm.rankId} onChange={e => setPromoteForm(p => ({ ...p, rankId: e.target.value }))}>
                  <option value="">Select rank…</option>
                  {ranks.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select></div>
              <div className="form-group"><label className="label">Notes</label>
                <textarea className="input resize-none" rows={2} value={promoteForm.notes} onChange={e => setPromoteForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional promotion notes…" /></div>
              <div className="flex gap-3"><button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                {saving ? "Promoting…" : "Award Promotion"}
              </button><button type="button" onClick={() => setShowPromoteModal(false)} className="btn-secondary">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
