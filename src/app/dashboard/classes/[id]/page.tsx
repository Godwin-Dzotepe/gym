import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Clock, Users, MapPin, Video, Calendar } from "lucide-react";

interface Props { params: Promise<{ id: string }> }

export default async function ClassDetailPage({ params }: Props) {
  const { id } = await params;
  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      bookings: {
        where: { cancelled: false },
        include: { member: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { bookedAt: "asc" },
      },
      _count: { select: { bookings: { where: { cancelled: false } } } },
    },
  });
  if (!cls) notFound();

  const spotsLeft = cls.capacity ? cls.capacity - cls._count.bookings : null;

  return (
    <div className="space-y-5 max-w-4xl">
      <Link href="/dashboard/classes" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-3.5 h-3.5" /> Classes
      </Link>

      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-4 h-4 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: cls.color ?? "#4f46e5" }} />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="page-title">{cls.title}</h1>
                {cls.description && <p className="text-slate-500 text-sm mt-1">{cls.description}</p>}
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/classes/${id}/bookings`} className="btn-secondary text-sm">
                  Manage Bookings
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="w-4 h-4 text-slate-400" />
                <div>
                  <p>{formatDate(cls.startTime, "EEE, MMM d")}</p>
                  <p className="text-xs text-slate-400">
                    {formatDate(cls.startTime, "h:mm a")} – {formatDate(cls.endTime, "h:mm a")}
                  </p>
                </div>
              </div>
              {cls.location && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{cls.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users className="w-4 h-4 text-slate-400" />
                <span>
                  {cls._count.bookings} booked
                  {cls.capacity && ` / ${cls.capacity}`}
                  {spotsLeft !== null && spotsLeft <= 0 && <span className="ml-1 text-red-500 text-xs">Full</span>}
                </span>
              </div>
              {cls.zoomLink && (
                <div className="flex items-center gap-2 text-sm">
                  <Video className="w-4 h-4 text-blue-500" />
                  <a href={cls.zoomLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Join Zoom
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bookings list */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="section-title">Bookings ({cls._count.bookings})</h2>
        </div>
        {cls.bookings.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">No bookings yet</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {cls.bookings.map((b) => (
              <div key={b.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <Link href={`/dashboard/members/${b.member.id}`} className="text-sm font-medium text-slate-800 hover:text-sky-600">
                    {b.member.firstName} {b.member.lastName}
                  </Link>
                  <p className="text-xs text-slate-400">{b.member.email}</p>
                </div>
                <p className="text-xs text-slate-400">{formatDate(b.bookedAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
