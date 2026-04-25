import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { getGymCurrency } from "@/lib/currency";
import RevenueChart from "@/components/dashboard/DashboardCharts";
import { BarChart3, TrendingUp, Users, UserMinus } from "lucide-react";
import ReportsHeader from "./ReportsHeader";

export default async function ReportsPage() {
  const currency = await getGymCurrency();
  const [
    totalRevenue,
    monthlyRevenue,
    membersByStatus,
    topPlans,
    attendanceByDay,
  ] = await Promise.all([
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    prisma.$queryRaw<{ month: string; revenue: number }[]>`
      SELECT DATE_FORMAT(MIN(createdAt), '%b %Y') as month, SUM(amount) as revenue
      FROM Payment WHERE status = 'PAID' AND createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(createdAt, '%Y-%m') ORDER BY DATE_FORMAT(createdAt, '%Y-%m') ASC
    `,
    prisma.member.groupBy({ by: ["status"], _count: true }),
    prisma.plan.findMany({
      include: { _count: { select: { memberPlans: { where: { isActive: true } } } } },
      orderBy: { memberPlans: { _count: "desc" } },
      take: 5,
    }),
    prisma.$queryRaw<{ day: string; count: number }[]>`
      SELECT DAYNAME(checkedInAt) as day, COUNT(*) as count
      FROM Attendance WHERE checkedInAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DAYNAME(checkedInAt) ORDER BY FIELD(DAYNAME(checkedInAt),'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')
    `,
  ]);

  const statusMap = Object.fromEntries(membersByStatus.map((s) => [s.status, s._count]));

  return (
    <div className="space-y-6">
      <ReportsHeader />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: formatCurrency(Number(totalRevenue._sum.amount ?? 0), currency), icon: TrendingUp, card: "bg-emerald-500 hover:bg-emerald-600", iconBg: "bg-emerald-400/30" },
          { label: "Active Members", value: (statusMap.ACTIVE ?? 0).toString(), icon: Users, card: "bg-indigo-500 hover:bg-indigo-600", iconBg: "bg-indigo-400/30" },
          { label: "Cancelled", value: (statusMap.CANCELLED ?? 0).toString(), icon: UserMinus, card: "bg-red-500 hover:bg-red-600", iconBg: "bg-red-400/30" },
          { label: "Frozen", value: (statusMap.FROZEN ?? 0).toString(), icon: BarChart3, card: "bg-blue-500 hover:bg-blue-600", iconBg: "bg-blue-400/30" },
        ].map((s) => (
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
          <h2 className="section-title mb-4">Monthly Revenue</h2>
          <RevenueChart monthlyRevenue={monthlyRevenue} />
        </div>

        {/* Top Plans */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Top Plans by Members</h2>
          <div className="space-y-3">
            {topPlans.map((plan, i) => {
              const max = topPlans[0]?._count.memberPlans ?? 1;
              const pct = Math.round((plan._count.memberPlans / max) * 100);
              return (
                <div key={plan.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 font-medium">{plan.name}</span>
                    <span className="text-sm text-gray-500">{plan._count.memberPlans}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {topPlans.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No plan data yet</p>
            )}
          </div>
        </div>

        {/* Attendance by Day */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Attendance by Day (Last 30 Days)</h2>
          <div className="space-y-3">
            {attendanceByDay.map((d) => {
              const max = Math.max(...attendanceByDay.map((x) => Number(x.count)), 1);
              const pct = Math.round((Number(d.count) / max) * 100);
              return (
                <div key={d.day}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{d.day}</span>
                    <span className="text-sm text-gray-500">{d.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {attendanceByDay.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No attendance data yet</p>
            )}
          </div>
        </div>

        {/* Member Status Breakdown */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Member Status Breakdown</h2>
          <div className="space-y-3">
            {membersByStatus.map((s) => {
              const total = membersByStatus.reduce((a, b) => a + b._count, 0);
              const pct = total > 0 ? Math.round((s._count / total) * 100) : 0;
              const colors: Record<string, string> = {
                ACTIVE: "bg-green-500", PENDING: "bg-yellow-400",
                FROZEN: "bg-blue-400", CANCELLED: "bg-red-400", LEAD: "bg-purple-400",
              };
              return (
                <div key={s.status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{s.status.charAt(0) + s.status.slice(1).toLowerCase()}</span>
                    <span className="text-sm text-gray-500">{s._count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors[s.status] ?? "bg-gray-400"}`}
                      style={{ width: `${pct}%` }}
                    />
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
