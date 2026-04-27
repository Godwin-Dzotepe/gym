import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { UserPlus, Search, Mail, Download } from "lucide-react";
import MembersTable from "@/components/members/MembersTable";
import MembersToolbar from "./MembersToolbar";

interface Props {
  searchParams: Promise<{ status?: string; search?: string; page?: string; tab?: string; planId?: string }>;
}

export default async function MembersPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = params.status;
  const search = params.search;
  const tab = params.tab ?? "members";
  const planId = params.planId;
  const page = parseInt(params.page ?? "1");
  const limit = 20;

  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { email: { contains: search } },
      { memberNumber: { contains: search } },
    ];
  }
  if (tab === "visitors") {
    where.memberPlans = { none: { isActive: true } };
  } else if (planId) {
    where.memberPlans = { some: { planId, isActive: true } };
  }

  const [members, total, counts, plans, settings] = await Promise.all([
    prisma.member.findMany({
      where,
      include: {
        memberPlans: {
          where: { isActive: true },
          include: { plan: { select: { name: true } } },
          take: 1,
        },
        invoices: { where: { status: "PENDING" }, select: { id: true } },
        _count: { select: { attendances: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.member.count({ where }),
    prisma.member.groupBy({ by: ["status"], _count: true }),
    prisma.plan.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.gymSettings.findFirst({ select: { expiryNotifDays: true } }),
  ]);

  const statusCounts = Object.fromEntries(counts.map(c => [c.status, c._count]));

  const TABS = [
    { key: "members", label: "Members", count: (statusCounts.ACTIVE ?? 0) + (statusCounts.PENDING ?? 0) + (statusCounts.FROZEN ?? 0) },
    { key: "visitors", label: "Visitors", count: null },
    { key: "frozen", label: "Frozen", count: statusCounts.FROZEN ?? 0 },
  ];

  const statusTabs = [
    { label: "All", value: undefined },
    { label: "Active", value: "ACTIVE", count: statusCounts.ACTIVE ?? 0 },
    { label: "Pending", value: "PENDING", count: statusCounts.PENDING ?? 0 },
    { label: "Frozen", value: "FROZEN", count: statusCounts.FROZEN ?? 0 },
    { label: "Cancelled", value: "CANCELLED", count: statusCounts.CANCELLED ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Members</h1>
          <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} total</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-sm"><Mail className="w-4 h-4" /> Invite</button>
          <a href="/api/members/export" className="btn-secondary text-sm">
            <Download className="w-4 h-4" /> Export CSV
          </a>
          <Link href="/dashboard/members/new" className="btn-primary">
            <UserPlus className="w-4 h-4" /> Add Member
          </Link>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto w-full sm:w-fit scrollbar-none" style={{scrollbarWidth:'none'}}>
        {TABS.map(t => {
          const isActive = tab === t.key || (!params.tab && t.key === "members");
          return (
            <Link key={t.key} href={`/dashboard/members?tab=${t.key}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              {t.label}
              {t.count !== null && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-indigo-100 text-indigo-600" : "bg-gray-200 text-gray-500"
                }`}>{t.count}</span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Status sub-tabs (only on members tab) */}
      {tab === "members" && (
        <div className="flex gap-1 overflow-x-auto pb-0.5" style={{scrollbarWidth:'none'}}>
          {statusTabs.map(t => {
            const isActive = status === t.value || (!status && !t.value);
            const href = t.value
              ? `/dashboard/members?tab=members&status=${t.value}`
              : "/dashboard/members?tab=members";
            return (
              <Link key={t.label} href={href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-100"
                }`}>
                {t.label}
                {t.count !== undefined && (
                  <span className="ml-1 text-xs opacity-70">{t.count}</span>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <form>
              <input name="search" defaultValue={search} type="text"
                placeholder="Search by name, email, member #…"
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </form>
          </div>
          <MembersToolbar plans={plans} currentStatus={status} currentPlanId={planId} currentSearch={search} />
        </div>

        <MembersTable
          members={members.map(m => ({ ...m, balance: Number(m.balance) })) as any}
          warningDays={settings?.expiryNotifDays ?? 7}
        />

        {total > limit && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/dashboard/members?tab=${tab}&page=${page - 1}${status ? `&status=${status}` : ""}`}
                  className="btn-secondary text-xs px-3 py-1.5">Previous</Link>
              )}
              {page * limit < total && (
                <Link href={`/dashboard/members?tab=${tab}&page=${page + 1}${status ? `&status=${status}` : ""}`}
                  className="btn-primary text-xs px-3 py-1.5">Next</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
