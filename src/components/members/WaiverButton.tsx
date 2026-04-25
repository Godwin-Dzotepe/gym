"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, X, CheckCircle2, Loader2, PenLine } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";

const DEFAULT_WAIVER = `MEMBERSHIP WAIVER & RELEASE OF LIABILITY

I, the undersigned, acknowledge that participation in fitness activities involves certain inherent risks of injury. In consideration of being allowed to participate in the gym facilities and activities, I hereby agree to assume all risks of injury and release The Oracle Gym, its staff, and agents from any liability for injuries arising from my participation.

I confirm that I am in good physical health and have no medical conditions that would prevent safe participation. I agree to follow all gym rules and regulations.

By signing below, I acknowledge that I have read, understood, and agree to the terms of this waiver.`;

export default function WaiverButton({ memberId, waiverSigned, waiverSignedAt }: {
  memberId: string;
  waiverSigned: boolean;
  waiverSignedAt: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function sign() {
    if (!agreed) return;
    setSaving(true);
    const res = await fetch(`/api/members/${memberId}/waiver`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waiverText: DEFAULT_WAIVER }),
    });
    setSaving(false);
    if (!res.ok) { toast.error("Failed to record waiver."); return; }
    toast.success("Waiver signed successfully.");
    setOpen(false);
    router.refresh();
  }

  if (waiverSigned) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-2.5 py-1 font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" /> Waiver signed {waiverSignedAt ? formatDate(waiverSignedAt) : ""}
      </span>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1 font-medium hover:bg-amber-100 transition-colors">
        <PenLine className="w-3.5 h-3.5" /> Sign Waiver
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                <h2 className="font-semibold text-gray-900">Membership Waiver</h2>
              </div>
              <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 max-h-64 overflow-y-auto">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">{DEFAULT_WAIVER}</pre>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-gray-700">
                  I have read, understood, and agree to the terms of this waiver and release of liability.
                </span>
              </label>
              <div className="flex gap-3">
                <button onClick={sign} disabled={!agreed || saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {saving ? "Signing…" : "Sign Waiver"}
                </button>
                <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
