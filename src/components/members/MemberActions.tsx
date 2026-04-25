"use client";

import { useState } from "react";
import { Edit, MoreHorizontal, UserX, Snowflake, CheckCircle2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";

interface Props { memberId: string; memberStatus: string; }

export default function MemberActions({ memberId, memberStatus }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  async function updateStatus(status: string) {
    const labels: Record<string, { title: string; message: string; label: string; danger: boolean }> = {
      ACTIVE:    { title: "Activate Member?",    message: "This will restore the member's access.",                       label: "Activate",   danger: false },
      FROZEN:    { title: "Freeze Account?",     message: "The member will lose access until unfrozen.",                  label: "Freeze",     danger: true  },
      CANCELLED: { title: "Cancel Membership?",  message: "This will cancel the member's membership. Are you sure?",      label: "Cancel",     danger: true  },
    };
    const cfg = labels[status];
    const ok = await confirm({ title: cfg.title, message: cfg.message, confirmLabel: cfg.label, danger: cfg.danger });
    if (!ok) return;
    setLoading(true);
    await fetch(`/api/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    setOpen(false);
    const successMsg: Record<string, string> = {
      ACTIVE: "Member activated successfully.",
      FROZEN: "Account frozen.",
      CANCELLED: "Membership cancelled.",
    };
    toast.success(successMsg[status]);
    router.refresh();
  }

  async function deleteMember() {
    const ok = await confirm({
      title: "Delete Member?",
      message: "This will permanently delete the member and all their data. This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setLoading(true);
    await fetch(`/api/members/${memberId}`, { method: "DELETE" });
    toast.success("Member deleted.");
    router.push("/dashboard/members");
  }

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <Link href={`/dashboard/members/${memberId}/edit`} className="btn-secondary text-sm">
        <Edit className="w-3.5 h-3.5" /> Edit
      </Link>
      <div className="relative">
        <button onClick={() => setOpen(!open)} className="btn-icon border border-slate-200" disabled={loading}>
          <MoreHorizontal className="w-4 h-4" />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="dropdown-menu right-0 top-10 w-48 z-20">
              {memberStatus !== "ACTIVE" && (
                <button onClick={() => updateStatus("ACTIVE")} className="dropdown-item">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Activate
                </button>
              )}
              {memberStatus !== "FROZEN" && (
                <button onClick={() => updateStatus("FROZEN")} className="dropdown-item">
                  <Snowflake className="w-3.5 h-3.5 text-blue-500" /> Freeze Account
                </button>
              )}
              {memberStatus !== "CANCELLED" && (
                <button onClick={() => updateStatus("CANCELLED")} className="dropdown-item">
                  <UserX className="w-3.5 h-3.5 text-slate-500" /> Cancel Membership
                </button>
              )}
              <div className="dropdown-divider" />
              <button onClick={deleteMember} className="dropdown-item dropdown-item-danger">
                <Trash2 className="w-3.5 h-3.5" /> Delete Member
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
