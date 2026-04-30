"use client";

import Link from "next/link";
import { formatDate, getInitials } from "@/lib/utils";
import { MoreHorizontal, Eye, Edit, CreditCard, CheckSquare, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

interface Member {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: Date;
  memberPlans: { plan: { name: string }; endDate: Date | null }[];
  invoices: { id: string }[];
  _count: { attendances: number };
}

function MembershipCountdown({ endDate, warningDays }: { endDate: Date | null; warningDays: number }) {
  if (!endDate) return <span className="text-xs text-gray-400">—</span>;
  const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000);
  if (days < 0)  return <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Expired</span>;
  if (days === 0) return <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Today</span>;
  const label = days === 1 ? "1 day left" : `${days} days left`;
  if (days <= warningDays)
    return <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{label}</span>;
  return <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{label}</span>;
}

const STATUS_OPTIONS = [
  { value: "ACTIVE",    label: "Active"    },
  { value: "FROZEN",    label: "Frozen"    },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "PENDING",   label: "Pending"   },
];

export default function MembersTable({ members, warningDays = 7 }: { members: Member[]; warningDays?: number }) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [selected, setSelected]  = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("ACTIVE");
  const [bulking, setBulking] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: "badge-green", PENDING: "badge-yellow",
      FROZEN: "badge-blue",  CANCELLED: "badge-red", LEAD: "badge-purple",
    };
    return map[status] ?? "badge-gray";
  };

  const allSelected = members.length > 0 && members.every(m => selected.has(m.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(members.map(m => m.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function applyBulk() {
    if (selected.size === 0) return;
    setBulking(true);
    const res = await fetch("/api/members/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), status: bulkStatus }),
    });
    setBulking(false);
    if (!res.ok) { toast.error("Bulk update failed."); return; }
    const { updated } = await res.json();
    toast.success(`${updated} member${updated !== 1 ? "s" : ""} updated to ${bulkStatus.toLowerCase()}.`);
    setSelected(new Set());
    router.refresh();
  }

  if (members.length === 0) {
    return <div className="py-16 text-center text-gray-400 text-sm">No members found</div>;
  }

  return (
    <div onClick={(e) => { if (openMenu && !(e.target as HTMLElement).closest('[data-menu]')) setOpenMenu(null); }}>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border-b border-indigo-100">
          <CheckSquare className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <span className="text-sm font-medium text-indigo-700">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-indigo-600">Set status to</span>
            <select className="text-sm border border-indigo-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={applyBulk} disabled={bulking}
              className="btn-primary text-xs py-1.5 px-3">
              {bulking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {bulking ? "Applying…" : "Apply"}
            </button>
            <button onClick={() => setSelected(new Set())} className="p-1 text-indigo-400 hover:text-indigo-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="table-th w-10">
                <input type="checkbox" checked={allSelected} onChange={toggleAll}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              </th>
              <th className="table-th">Member</th>
              <th className="table-th hidden sm:table-cell">Plan</th>
              <th className="table-th">Status</th>
              <th className="table-th hidden md:table-cell">Expires</th>
              <th className="table-th hidden lg:table-cell">Sessions</th>
              <th className="table-th hidden sm:table-cell">Payment</th>
              <th className="table-th hidden lg:table-cell">Joined</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m, idx) => {
              const isNearBottom = idx >= members.length - 2;
              const isSelected = selected.has(m.id);
              return (
                <tr key={m.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? "bg-indigo-50/40" : ""}`}>
                  <td className="table-td w-10">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleOne(m.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs sm:text-sm font-semibold flex-shrink-0">
                        {getInitials(m.firstName, m.lastName)}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/dashboard/members/${m.id}`}
                          className="font-medium text-gray-900 hover:text-indigo-600 transition-colors block truncate">
                          {m.firstName} {m.lastName}
                        </Link>
                        <p className="text-xs text-gray-500 truncate">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td hidden sm:table-cell">
                    {m.memberPlans[0]?.plan.name
                      ? <span className="text-sm text-gray-700">{m.memberPlans[0].plan.name}</span>
                      : <span className="text-xs text-gray-400 italic">No plan</span>}
                  </td>
                  <td className="table-td">
                    <span className={`badge ${statusBadge(m.status)}`}>
                      {m.status.charAt(0) + m.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="table-td hidden md:table-cell">
                    <MembershipCountdown endDate={m.memberPlans[0]?.endDate ?? null} warningDays={warningDays} />
                  </td>
                  <td className="table-td text-sm text-gray-500 hidden lg:table-cell">{m._count.attendances}</td>
                  <td className="table-td hidden sm:table-cell">
                    {m.invoices.length > 0
                      ? <span className="badge badge-red">{m.invoices.length} unpaid</span>
                      : <span className="badge badge-green">Clear</span>}
                  </td>
                  <td className="table-td text-xs text-gray-500 hidden lg:table-cell">{formatDate(m.createdAt)}</td>
                  <td className="table-td">
                    <div className="relative" data-menu>
                      <button onClick={() => setOpenMenu(openMenu === m.id ? null : m.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {openMenu === m.id && (
                        <div className={`absolute right-0 ${isNearBottom ? "bottom-8" : "top-8"} bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-20 min-w-36`}>
                          <Link href={`/dashboard/members/${m.id}`}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <Eye className="w-3.5 h-3.5" /> View Profile
                          </Link>
                          <Link href={`/dashboard/members/${m.id}/edit`}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </Link>
                          <Link href={`/dashboard/billing?tab=payments&memberId=${m.id}`}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <CreditCard className="w-3.5 h-3.5" /> Billing
                          </Link>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
