"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Download, Filter } from "lucide-react";
import { useState, useTransition } from "react";

interface Plan { id: string; name: string; }

export default function MembersToolbar({ plans, currentStatus, currentPlanId, currentSearch }: {
  plans: Plan[];
  currentStatus?: string;
  currentPlanId?: string;
  currentSearch?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [, startTransition] = useTransition();

  function applyFilter(planId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (planId) params.set("planId", planId);
    else params.delete("planId");
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
    setShowFilter(false);
  }

  async function exportCSV() {
    setExporting(true);
    const params = new URLSearchParams();
    if (currentStatus) params.set("status", currentStatus);
    if (currentPlanId) params.set("planId", currentPlanId);
    if (currentSearch) params.set("search", currentSearch);
    const res = await fetch(`/api/members/export?${params.toString()}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `members-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  return (
    <div className="flex items-center gap-2 relative">
      <div className="relative">
        <button onClick={() => setShowFilter(v => !v)} className="btn-secondary text-sm">
          <Filter className="w-4 h-4" />
          Filter
          {currentPlanId && <span className="ml-1 w-2 h-2 bg-indigo-500 rounded-full inline-block" />}
        </button>
        {showFilter && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 w-56 p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Filter by Plan</p>
            <button onClick={() => applyFilter("")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 ${!currentPlanId ? "text-indigo-600 font-medium bg-indigo-50" : "text-gray-700"}`}>
              All Plans
            </button>
            {plans.map(p => (
              <button key={p.id} onClick={() => applyFilter(p.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 ${currentPlanId === p.id ? "text-indigo-600 font-medium bg-indigo-50" : "text-gray-700"}`}>
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <button onClick={exportCSV} disabled={exporting} className="btn-secondary text-sm">
        <Download className="w-4 h-4" />
        {exporting ? "Exporting…" : "Export CSV"}
      </button>
    </div>
  );
}
