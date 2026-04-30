import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { getGymCurrency } from "@/lib/currency";
import RevenueChart from "@/components/dashboard/DashboardCharts";
import { BarChart3, TrendingUp, Users, UserMinus } from "lucide-react";
import ReportsHeader from "./ReportsHeader";

interface Props {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function ReportsPage({ searchParams }: Props) {
  const params = await searchParams;
  const currency = await getGymCurrency();

  const now = new Date();

  const defaultFrom = new Date();
  defaultFrom.setMonth(defaultFrom.getMonth() - 6);

  const fromDate = params.from ? new Date(params.from) : defaultFrom;
  const toDate   = params.to   ? new Date(params.to + "T23:59:59") : now;

  const fromStr = params.from ?? defaultFrom.toISOString().split("T")[0];
  const toStr   = params.to   ?? now.toISOString().split("T")[0];

  const [
    totalRevenue,
    recentPayments,
    membersByStatus,
    topPlans,
    recentAttendances,
  ] = await Promise.all([
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    prisma.payment.findMany({
      where: { status: "PAID", createdAt: { gte: fromDate, lte: toDate } },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.member.groupBy({ by: ["status"], _count: true }),
    prisma.plan.findMany({
      include: { _count: { select: { memberPlans: true } } },
      orderBy: { memberPlans: { _count: "desc" } },
      take: 5,
    }),
    prisma.attendance.findMany({
      where: { checkedInAt: { gte: fromDate, lte: toDate } },
      select: { checkedInAt: true },
    }),
  ]);

  // Group payments by month
  const monthKeys: string[] = [];
  const monthMap = new Map<string, number>();
  for (const p of recentPayments) {
    const key = p.createdAt.toLocaleString("en-GB", { month: "short", year: "2-digit" });
    if (!monthMap.has(key)) monthKeys.push(key);
    monthMap.set(key, (monthMap.get(key) ?? 0) + Number(p.amount));
  }
  const monthlyRevenue = monthKeys.map(k => ({ month: k, revenue: monthMap.get(k)! }));

  // Group attendances by day of week
  const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const dayMap = new Map<string, number>();
  for (const a of recentAttendances) {
    const day = a.checkedInAt.toLocaleDateString("en-GB", { weekday: "long" });
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
  }
  const attendanceByDay = DAY_ORDER
    .filter(d => dayMap.has(d))
    .map(day => ({ day, count: dayMap.get(day)! }));

  const statusMap = Object.fromEntries(membersByStatus.map(s => [s.status, s._count]));

  return (
    <div className="space-y-6">
      <ReportsHeader from={fromStr} to={toStr} />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue",  value: formatCurrency(Number(totalRevenue._sum.amount ?? 0), currency), icon: TrendingUp, card: "bg-emerald-500 hover:bg-emerald-600", iconBg: "bg-emerald-400/30" },
          { label: "Active Members", value: (statusMap.ACTIVE    ?? 0).toString(), icon: Users,     card: "bg-indigo-500 hover:bg-indigo-600", iconBg: "bg-indigo-400/30" },
          { label: "Cancelled",      value: (statusMap.CANCELLED ?? 0).toString(), icon: UserMinus, card: "bg-red-500 hover:bg-red-600",     iconBg: "bg-red-400/30"     },
          { label: "Frozen",         value: (statusMap.FROZEN    ?? 0).toString(), icon: BarChart3, card: "bg-blue-500 hover:bg-blue-600",   iconBg: "bg-blue-400/30"    },
        ].map(s => (
          <div key={s.label} className={`relative overflow-hidden rounded-2xl p-5 transition-colors cursor-default shadow-sm ${s.card}`}>
            <s.icon className="absolute -right-3 -bottom-3 w-20 h-20 text-white opacity-10 pointer-events-none" strokeWidth={1} />
            <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center mb-3`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{s.label}</p>
            <p className="text-2xl font-bold text-white mt-1 leading-none">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Revenue Chart */}
        <div className="card p-5">
          <h2 className="section-title mb-4">
            Revenue{monthlyRevenue.length > 0 ? ` (${monthlyRevenue[0].month} – ${monthlyRevenue[monthlyRevenue.length - 1].month})` : ""}
          </h2>
          {monthlyRevenue.length === 0
            ? <p className="text-sm text-gray-400 text-center py-8">No payments in this date range</p>
            : <RevenueChart monthlyRevenue={monthlyRevenue} />
          }
        </div>

        {/* Top Plans */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Top Plans by Members</h2>
          <div className="space-y-3">
            {topPlans.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No plan data yet</p>
            ) : topPlans.map((plan, i) => {
              const max = topPlans[0]?._count.memberPlans ?? 1;
              const pct = max > 0 ? Math.round((plan._count.memberPlans / max) * 100) : 0;
              return (
                <div key={plan.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 font-medium">{plan.name}</span>
                    <span className="text-sm text-gray-500">{plan._count.memberPlans}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attendance by Day */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Attendance by Day</h2>
          <div className="space-y-3">
            {attendanceByDay.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No attendance data in this date range</p>
            ) : attendanceByDay.map(d => {
              const max = Math.max(...attendanceByDay.map(x => x.count), 1);
              const pct = Math.round((d.count / max) * 100);
              return (
                <div key={d.day}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{d.day}</span>
                    <span className="text-sm text-gray-500">{d.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Member Status Breakdown */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Member Status Breakdown</h2>
          <div className="space-y-3">
            {membersByStatus.map(s => {
              const total = membersByStatus.reduce((a, b) => a + b._count, 0);
              const pct   = total > 0 ? Math.round((s._count / total) * 100) : 0;
              const colors: Record<string, string> = {
                ACTIVE: "bg-green-500", PENDING: "bg-yellow-400",
                FROZEN: "bg-blue-400",  CANCELLED: "bg-red-400", LEAD: "bg-purple-400",
              };
              return (
                <div key={s.status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{s.status.charAt(0) + s.status.slice(1).toLowerCase()}</span>
                    <span className="text-sm text-gray-500">{s._count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${colors[s.status] ?? "bg-gray-400"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
