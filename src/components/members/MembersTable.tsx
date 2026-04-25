"use client";

import Link from "next/link";
import { formatDate, getInitials } from "@/lib/utils";
import { MoreHorizontal, Eye, Edit, CreditCard, UserX } from "lucide-react";
import { useState } from "react";

interface Member {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: Date;
  lastVisit: Date | null;
  memberPlans: { plan: { name: string } }[];
  invoices: { id: string }[];
  _count: { attendances: number };
}

export default function MembersTable({ members }: { members: Member[] }) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: "badge-green", PENDING: "badge-yellow",
      FROZEN: "badge-blue", CANCELLED: "badge-red", LEAD: "badge-purple",
    };
    return map[status] ?? "badge-gray";
  };

  if (members.length === 0) {
    return <div className="py-16 text-center text-gray-400 text-sm">No members found</div>;
  }

  return (
    <div className="overflow-x-auto" onClick={(e) => { if (openMenu && !(e.target as HTMLElement).closest('[data-menu]')) setOpenMenu(null); }}>
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="table-th">Member</th>
            <th className="table-th hidden sm:table-cell">Plan</th>
            <th className="table-th">Status</th>
            <th className="table-th hidden md:table-cell">Last Visit</th>
            <th className="table-th hidden lg:table-cell">Sessions</th>
            <th className="table-th hidden sm:table-cell">Payment</th>
            <th className="table-th hidden lg:table-cell">Joined</th>
            <th className="table-th">Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m, idx) => {
            const isNearBottom = idx >= members.length - 2;
            return (
            <tr key={m.id} className="hover:bg-gray-50 transition-colors">
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
              <td className="table-td text-sm text-gray-500 hidden md:table-cell">
                {m.lastVisit ? formatDate(m.lastVisit) : <span className="text-gray-300">Never</span>}
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
  );
}
