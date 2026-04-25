import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Plus, Clock, Users, Video, Calendar, BookOpen, CheckCircle2 } from "lucide-react";

export default async function ClassesPage() {
  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const todayEnd   = new Date(today.setHours(23, 59, 59, 999));

  const [classes, totalBookings, todayCount] = await Promise.all([
    prisma.class.findMany({
      where: { isActive: true, startTime: { gte: new Date() } },
      include: { _count: { select: { bookings: { where: { cancelled: false } } } } },
      orderBy: { startTime: "asc" },
      take: 50,
    }),
    prisma.classBooking.count({ where: { cancelled: false } }),
    prisma.class.count({ where: { isActive: true, startTime: { gte: todayStart, lte: todayEnd } } }),
  ]);

  const totalSpots = classes.reduce((s, c) => s + (c.capacity ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Classes & Schedule</h1>
          <p className="text-gray-500 text-sm mt-1">Upcoming classes and bookings</p>
        </div>
        <Link href="/dashboard/classes/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New Class
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Upcoming Classes", value: classes.length.toString(),  icon: Calendar,     card: "bg-indigo-500 hover:bg-indigo-600",   iconBg: "bg-indigo-400/30" },
          { label: "Today's Classes",  value: todayCount.toString(),       icon: CheckCircle2, card: "bg-emerald-500 hover:bg-emerald-600", iconBg: "bg-emerald-400/30" },
          { label: "Total Bookings",   value: totalBookings.toString(),    icon: BookOpen,     card: "bg-orange-500 hover:bg-orange-600",   iconBg: "bg-orange-400/30" },
          { label: "Total Capacity",   value: totalSpots > 0 ? totalSpots.toString() : "—", icon: Users, card: "bg-violet-500 hover:bg-violet-600", iconBg: "bg-violet-400/30" },
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

      {/* Classes grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.length === 0 ? (
          <div className="col-span-3 card p-12 text-center">
            <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 mb-4">No upcoming classes scheduled.</p>
            <Link href="/dashboard/classes/new" className="btn-primary text-sm inline-flex">Schedule a Class</Link>
          </div>
        ) : classes.map((cls) => {
          const spotsLeft = cls.capacity ? cls.capacity - cls._count.bookings : null;
          const isFull    = spotsLeft !== null && spotsLeft <= 0;
          const pct       = cls.capacity ? Math.round((cls._count.bookings / cls.capacity) * 100) : 0;
          const color     = cls.color ?? "#4f46e5";

          return (
            <div key={cls.id} className="card overflow-hidden hover:shadow-md transition-shadow group">
              {/* Color accent bar */}
              <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <h3 className="font-bold text-gray-900 truncate">{cls.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {cls.zoomLink && <span className="badge badge-blue text-[10px]"><Video className="w-2.5 h-2.5 inline mr-0.5" />Online</span>}
                    {isFull && <span className="badge badge-red text-[10px]">Full</span>}
                  </div>
                </div>

                {cls.location && <p className="text-xs text-gray-400 mb-3 truncate">📍 {cls.location}</p>}

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    {formatDate(cls.startTime, "EEE, MMM d · h:mm a")}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    {cls._count.bookings} booked{cls.capacity ? ` of ${cls.capacity}` : ""}
                    {spotsLeft !== null && spotsLeft > 0 && (
                      <span className="text-emerald-600 font-semibold">· {spotsLeft} left</span>
                    )}
                  </div>
                </div>

                {/* Capacity fill bar */}
                {cls.capacity && (
                  <div className="mb-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: isFull ? "#ef4444" : color }} />
                  </div>
                )}

                <div className="flex gap-2">
                  <Link href={`/dashboard/classes/${cls.id}`} className="btn-secondary text-xs flex-1 justify-center">Details</Link>
                  <Link href={`/dashboard/classes/${cls.id}/bookings`} className="btn-primary text-xs flex-1 justify-center">
                    Bookings ({cls._count.bookings})
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
