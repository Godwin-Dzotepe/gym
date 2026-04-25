import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { CheckCircle2, Calendar } from "lucide-react";

export default async function PortalAttendancePage() {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId;

  const [attendances, total, thisMonth] = await Promise.all([
    prisma.attendance.findMany({
      where: { memberId },
      orderBy: { checkedInAt: "desc" },
      take: 30,
      include: { class: { select: { title: true } } },
    }),
    prisma.attendance.count({ where: { memberId } }),
    prisma.attendance.count({
      where: { memberId, checkedInAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    }),
  ]);

  return (
    <div className="space-y-5">
      <h1 className="page-title">My Attendance</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 text-center">
          <p className="stat-label">Total Sessions</p>
          <p className="stat-value mt-1">{total}</p>
        </div>
        <div className="card p-5 text-center">
          <p className="stat-label">This Month</p>
          <p className="stat-value mt-1 text-sky-600">{thisMonth}</p>
        </div>
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <h2 className="section-title">Check-in History</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {attendances.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">No check-ins yet</p>
          ) : attendances.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-5 py-3">
              <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">
                  {a.class?.title ?? "Open Floor"}
                </p>
                <p className="text-xs text-slate-400">{formatDate(a.checkedInAt, "EEEE, MMMM d, yyyy · h:mm a")}</p>
              </div>
              <span className="badge badge-gray text-[10px]">{a.method.replace("_", " ")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
