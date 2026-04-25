import { prisma } from "@/lib/prisma";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { Monitor, Users, TrendingUp } from "lucide-react";
import ManualCheckin from "./ManualCheckin";
import AttendanceFilters from "./AttendanceFilters";

interface Props {
  searchParams: Promise<{ from?: string; to?: string; method?: string; search?: string }>;
}

export default async function AttendancePage({ searchParams }: Props) {
  const params = await searchParams;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const fromDate = params.from ? new Date(params.from) : null;
  const toDate   = params.to   ? new Date(params.to + "T23:59:59") : null;
  const method   = params.method ?? "";
  const search   = params.search ?? "";

  const where: any = {};
  if (fromDate || toDate) {
    where.checkedInAt = {};
    if (fromDate) where.checkedInAt.gte = fromDate;
    if (toDate)   where.checkedInAt.lte = toDate;
  }
  if (method) where.method = method;
  if (search) {
    where.member = {
      OR: [
        { firstName: { contains: search } },
        { lastName:  { contains: search } },
        { memberNumber: { contains: search } },
      ],
    };
  }

  const [todayLogs, recentLogs, weekStats] = await Promise.all([
    prisma.attendance.count({ where: { checkedInAt: { gte: today } } }),
    prisma.attendance.findMany({
      where,
      take: 100,
      orderBy: { checkedInAt: "desc" },
      include: {
        member: { select: { firstName: true, lastName: true, memberNumber: true } },
        class: { select: { title: true } },
      },
    }),
    prisma.$queryRaw<{ day: string; count: number }[]>`
      SELECT DATE_FORMAT(checkedInAt, '%a') as day, COUNT(*) as count
      FROM Attendance
      WHERE checkedInAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(checkedInAt), DATE_FORMAT(checkedInAt, '%a')
      ORDER BY DATE(checkedInAt) ASC
    `,
  ]);

  const methodBadge = (m: string) => {
    const map: Record<string, string> = {
      PIN: "badge-blue", QR_CODE: "badge-green", BARCODE: "badge-purple",
      NAME_SEARCH: "badge-yellow", MANUAL: "badge-gray", MASS_CHECKIN: "badge-green",
    };
    return map[m] ?? "badge-gray";
  };

  const isFiltered = !!(params.from || params.to || params.method || params.search);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="text-gray-500 text-sm mt-1">Track member check-ins and sessions</p>
        </div>
        <div className="flex gap-2">
          <ManualCheckin />
          <Link href="/kiosk" target="_blank" className="btn-primary">
            <Monitor className="w-4 h-4" />
            Open Kiosk
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Today's Check-ins", value: todayLogs.toString(), icon: Monitor, card: "bg-sky-500 hover:bg-sky-600", iconBg: "bg-sky-400/30" },
          { label: "This Week", value: weekStats.reduce((a, b) => a + Number(b.count), 0).toString(), icon: TrendingUp, card: "bg-emerald-500 hover:bg-emerald-600", iconBg: "bg-emerald-400/30" },
          { label: "Avg / Day (7d)", value: (weekStats.length > 0 ? Math.round(weekStats.reduce((a, b) => a + Number(b.count), 0) / weekStats.length) : 0).toString(), icon: Users, card: "bg-violet-500 hover:bg-violet-600", iconBg: "bg-violet-400/30" },
        ].map((s) => (
          <div key={s.label} className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-colors cursor-default shadow-sm ${s.card}`}>
            <s.icon className="absolute -right-3 -bottom-3 w-14 sm:w-20 h-14 sm:h-20 text-white opacity-10 pointer-events-none" strokeWidth={1} />
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${s.iconBg} flex items-center justify-center mb-2 sm:mb-3`}>
              <s.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/70">{s.label}</p>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1 leading-none">{s.value}</p>
          </div>
        ))}
      </div>

      <AttendanceFilters current={{ from: params.from, to: params.to, method: params.method, search: params.search }} />

      {/* Log */}
      <div className="card">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="section-title">
            {isFiltered ? `Filtered Results (${recentLogs.length})` : "Recent Check-ins"}
          </h2>
          <Users className="w-5 h-5 text-gray-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="table-th">Member</th>
                <th className="table-th hidden sm:table-cell">Class</th>
                <th className="table-th hidden md:table-cell">Method</th>
                <th className="table-th">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.length === 0 ? (
                <tr><td colSpan={4} className="table-td text-center text-gray-400 py-10">
                  No check-ins {isFiltered ? "match your filters" : "recorded yet"}
                </td></tr>
              ) : recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td">
                    <p className="font-medium text-gray-900">{log.member.firstName} {log.member.lastName}</p>
                    <p className="text-xs text-gray-500">{log.member.memberNumber}</p>
                  </td>
                  <td className="table-td text-gray-600 text-sm hidden sm:table-cell">
                    {log.class?.title ?? <span className="text-gray-400 italic">Open floor</span>}
                  </td>
                  <td className="table-td hidden md:table-cell">
                    <span className={`badge ${methodBadge(log.method)}`}>{log.method.replace("_", " ")}</span>
                  </td>
                  <td className="table-td text-gray-500 text-sm">{formatRelativeTime(log.checkedInAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
