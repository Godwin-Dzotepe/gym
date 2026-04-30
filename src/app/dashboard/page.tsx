import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { getGymCurrency } from "@/lib/currency";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import Link from "next/link";
import {
  Users, TrendingUp, AlertTriangle, UserCheck,
  CreditCard, Calendar, UserPlus, ArrowRight,
  CheckCircle2, Clock, XCircle,
} from "lucide-react";
import StatCard from "@/components/shared/StatCard";

async function getStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const [
    totalMembers, activeMembers, pendingMembers, frozenMembers,
    monthlyRevenue, pendingInvoices, failedInvoices,
    todayAttendance, activeLeads,
    recentPayments, expiringPlans, recentMembers, revenueHistory,
  ] = await Promise.all([
    prisma.member.count(),
    prisma.member.count({ where: { status: "ACTIVE" } }),
    prisma.member.count({ where: { status: "PENDING" } }),
    prisma.member.count({ where: { status: "FROZEN" } }),
    prisma.payment.aggregate({
      where: { status: "PAID", createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.invoice.count({ where: { status: "PENDING" } }),
    prisma.invoice.count({ where: { status: "FAILED" } }),
    prisma.attendance.count({ where: { checkedInAt: { gte: today } } }),
    prisma.lead.count({ where: { status: { notIn: ["CONVERTED", "LOST"] } } }),
    prisma.payment.findMany({
      take: 6, orderBy: { createdAt: "desc" }, where: { status: "PAID" },
      include: { member: { select: { firstName: true, lastName: true } } },
    }),
    prisma.memberPlan.findMany({
      where: { isActive: true, endDate: { lte: new Date(Date.now() + 7 * 86400000), gte: new Date() } },
      include: { member: { select: { firstName: true, lastName: true } }, plan: { select: { name: true } } },
      take: 5,
    }),
    prisma.member.findMany({
      take: 5, orderBy: { createdAt: "desc" },
      select: { id: true, firstName: true, lastName: true, email: true, status: true, createdAt: true,
        memberPlans: { where: { isActive: true }, include: { plan: { select: { name: true } } }, take: 1 },
      },
    }),
    prisma.$queryRaw<{ month: string; revenue: number }[]>`
      SELECT DATE_FORMAT(MIN(createdAt),'%b %Y') as month, SUM(amount) as revenue
      FROM Payment WHERE status='PAID' AND createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(createdAt,'%Y-%m') ORDER BY DATE_FORMAT(createdAt,'%Y-%m') ASC
    `,
  ]);

  return {
    totalMembers, activeMembers, pendingMembers, frozenMembers,
    monthlyRevenue: Number(monthlyRevenue._sum.amount ?? 0),
    pendingInvoices, failedInvoices, todayAttendance, activeLeads,
    recentPayments, expiringPlans, recentMembers, revenueHistory,
  };
}

const statusBadge: Record<string, string> = {
  ACTIVE: "badge-green", PENDING: "badge-yellow",
  FROZEN: "badge-blue", CANCELLED: "badge-red",
};

export default async function DashboardPage() {
  const [s, currency] = await Promise.all([getStats(), getGymCurrency()]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Alerts */}
      {(s.failedInvoices > 0 || s.pendingMembers > 0 || s.expiringPlans.length > 0) && (
        <div className="space-y-2">
          {s.failedInvoices > 0 && (
            <div className="alert alert-error">
              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-800">{s.failedInvoices} Failed Payment{s.failedInvoices > 1 ? "s" : ""}</p>
                <p className="text-xs text-red-600 mt-0.5">Members have failed invoices that require action.</p>
              </div>
              <Link href="/dashboard/billing?status=FAILED" className="text-xs font-semibold text-red-700 hover:text-red-800 whitespace-nowrap">
                Review →
              </Link>
            </div>
          )}
          {s.pendingMembers > 0 && (
            <div className="alert alert-warning">
              <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-yellow-800">{s.pendingMembers} Pending Registration{s.pendingMembers > 1 ? "s" : ""}</p>
                <p className="text-xs text-yellow-700 mt-0.5">New members awaiting account activation.</p>
              </div>
              <Link href="/dashboard/members/pending" className="text-xs font-semibold text-yellow-700 hover:text-yellow-800 whitespace-nowrap">
                Review →
              </Link>
            </div>
          )}
          {s.expiringPlans.length > 0 && (
            <div className="alert alert-warning">
              <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-yellow-800">{s.expiringPlans.length} Membership{s.expiringPlans.length > 1 ? "s" : ""} Expiring Soon</p>
                <p className="text-xs text-yellow-700 mt-0.5">Plans expiring within the next 7 days.</p>
              </div>
              <Link href="/dashboard/members?tab=members&expiring=true" className="text-xs font-semibold text-yellow-700 hover:text-yellow-800 whitespace-nowrap">
                View →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Members" value={s.totalMembers.toLocaleString()}
          subtitle={`${s.activeMembers} active · ${s.frozenMembers} frozen`}
          icon={Users} color="sky"
          trend={`${s.pendingMembers} pending approval`} trendDir="neutral"
          href="/dashboard/members" />
        <StatCard title="Revenue This Month" value={formatCurrency(s.monthlyRevenue, currency)}
          subtitle="Collected payments"
          icon={TrendingUp} color="emerald"
          trend="Track in Reports" trendDir="up"
          href="/dashboard/reports" />
        <StatCard title="Unpaid Invoices" value={s.pendingInvoices.toLocaleString()}
          subtitle={s.failedInvoices > 0 ? `${s.failedInvoices} failed` : "All processing"}
          icon={CreditCard} color={s.failedInvoices > 0 ? "red" : "slate"}
          trend={s.failedInvoices > 0 ? `${s.failedInvoices} need attention` : "Looking good"}
          trendDir={s.failedInvoices > 0 ? "down" : "up"}
          href="/dashboard/billing" />
        <StatCard title="Today's Check-ins" value={s.todayAttendance.toLocaleString()}
          subtitle="Active sessions today"
          icon={UserCheck} color="violet"
          trend="View attendance log" trendDir="neutral"
          href="/dashboard/attendance" />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Leads" value={s.activeLeads.toLocaleString()}
          subtitle="In CRM pipeline"
          icon={UserPlus} color="orange"
          trend="View pipeline" trendDir="neutral" href="/dashboard/leads" />
        <StatCard title="Expiring Plans" value={s.expiringPlans.length.toLocaleString()}
          subtitle="Next 7 days"
          icon={Calendar} color={s.expiringPlans.length > 0 ? "yellow" : "slate"}
          trend="Needs renewal" trendDir={s.expiringPlans.length > 0 ? "down" : "neutral"}
          href="/dashboard/members?tab=members&expiring=true" />
        <StatCard title="Frozen Members" value={s.frozenMembers.toLocaleString()}
          subtitle="Temporarily inactive"
          icon={Users} color="blue"
          trend="View members" trendDir="neutral" href="/dashboard/members?status=FROZEN" />
        <StatCard title="Cancelled" value={(s.totalMembers - s.activeMembers - s.frozenMembers - s.pendingMembers).toLocaleString()}
          subtitle="Churned members"
          icon={XCircle} color="red"
          trend="Retention insights" trendDir="neutral" href="/dashboard/reports" />
      </div>

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="section-title">Revenue Overview</h2>
              <p className="text-xs text-slate-400 mt-0.5">Last 6 months</p>
            </div>
            <Link href="/dashboard/reports" className="btn-ghost text-xs">
              Full Report <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <DashboardCharts monthlyRevenue={s.revenueHistory} />
        </div>

        {/* New Members */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">New Members</h2>
            <Link href="/dashboard/members" className="text-xs text-sky-600 hover:text-sky-700 font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {s.recentMembers.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No members yet</p>
            ) : s.recentMembers.map((m) => (
              <Link key={m.id} href={`/dashboard/members/${m.id}`}
                className="flex items-center gap-3 hover:bg-slate-50 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                <div className="avatar avatar-sm flex-shrink-0">
                  {m.firstName.charAt(0)}{m.lastName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {m.firstName} {m.lastName}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {m.memberPlans[0]?.plan.name ?? "No plan assigned"}
                  </p>
                </div>
                <span className={`badge ${statusBadge[m.status] ?? "badge-gray"}`}>
                  {m.status.charAt(0) + m.status.slice(1).toLowerCase()}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Payments + Expiring Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Payments */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="section-title">Recent Payments</h2>
            <Link href="/dashboard/billing" className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {s.recentPayments.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No payments yet</p>
            ) : s.recentPayments.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">
                    {p.member.firstName} {p.member.lastName}
                  </p>
                  <p className="text-xs text-slate-400">{formatRelativeTime(p.createdAt)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-slate-800">{formatCurrency(Number(p.amount), currency)}</p>
                  <span className="badge badge-green text-[10px]">Paid</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expiring Plans */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="section-title">Expiring Plans</h2>
            <Link href="/dashboard/members?tab=members&expiring=true" className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {s.expiringPlans.length === 0 ? (
              <div className="flex items-center gap-3 px-5 py-8 justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <p className="text-sm text-slate-500">No plans expiring soon</p>
              </div>
            ) : s.expiringPlans.map((ep) => (
              <div key={ep.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="avatar avatar-sm flex-shrink-0">
                  {ep.member.firstName.charAt(0)}{ep.member.lastName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {ep.member.firstName} {ep.member.lastName}
                  </p>
                  <p className="text-xs text-slate-400">{ep.plan.name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium text-yellow-600">
                    {ep.endDate ? formatDate(ep.endDate, "MMM d") : "—"}
                  </p>
                  <span className="badge badge-yellow text-[10px]">Expiring</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
