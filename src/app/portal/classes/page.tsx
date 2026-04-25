import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import PortalClassBooking from "@/components/portal/PortalClassBooking";
import { Calendar } from "lucide-react";

export default async function PortalClassesPage() {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId;

  const classes = await prisma.class.findMany({
    where: { isActive: true, startTime: { gte: new Date() } },
    orderBy: { startTime: "asc" },
    include: {
      _count: { select: { bookings: { where: { cancelled: false } } } },
      bookings: { where: { memberId, cancelled: false }, select: { id: true } },
    },
    take: 20,
  });

  return (
    <div className="space-y-5">
      <h1 className="page-title">Classes</h1>

      {classes.length === 0 ? (
        <div className="card">
          <div className="empty-state py-16">
            <div className="empty-state-icon"><Calendar className="w-6 h-6" /></div>
            <p className="empty-state-title">No upcoming classes</p>
            <p className="empty-state-desc">Check back later for scheduled classes</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map((cls) => {
            const isBooked = cls.bookings.length > 0;
            const isFull = cls.capacity ? cls._count.bookings >= cls.capacity : false;
            return (
              <div key={cls.id} className="card p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: cls.color ?? "#0ea5e9" }} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{cls.title}</h3>
                    {cls.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{cls.description}</p>}
                  </div>
                  {isBooked && <span className="badge badge-green text-[10px]">Booked</span>}
                </div>

                <div className="text-sm text-slate-600 space-y-1 mb-4">
                  <p>{formatDate(cls.startTime, "EEE, MMM d · h:mm a")}</p>
                  {cls.location && <p className="text-slate-400">{cls.location}</p>}
                  <p className="text-xs text-slate-400">
                    {cls._count.bookings} enrolled
                    {cls.capacity && ` / ${cls.capacity} max`}
                    {isFull && " · Full"}
                  </p>
                </div>

                <PortalClassBooking
                  classId={cls.id}
                  memberId={memberId}
                  isBooked={isBooked}
                  isFull={isFull && !isBooked}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
