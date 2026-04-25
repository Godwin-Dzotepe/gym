import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";

interface Props { params: Promise<{ id: string }> }

export default async function ClassBookingsPage({ params }: Props) {
  const { id } = await params;
  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      bookings: {
        include: {
          member: { select: { id: true, firstName: true, lastName: true, email: true, memberNumber: true, status: true } },
        },
        orderBy: { bookedAt: "asc" },
      },
    },
  });
  if (!cls) notFound();

  const active = cls.bookings.filter((b) => !b.cancelled);
  const cancelled = cls.bookings.filter((b) => b.cancelled);

  return (
    <div className="space-y-5 max-w-4xl">
      <Link href={`/dashboard/classes/${id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-3.5 h-3.5" /> {cls.title}
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Bookings — {cls.title}</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {formatDate(cls.startTime, "EEE, MMM d · h:mm a")}
            {cls.capacity && ` · ${active.length} / ${cls.capacity} spots filled`}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Users className="w-4 h-4" />
          <span>{active.length} booked</span>
        </div>
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="section-title">Active Bookings ({active.length})</h2>
        </div>
        {active.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">No bookings yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="table-th">#</th>
                  <th className="table-th">Member</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Booked At</th>
                </tr>
              </thead>
              <tbody>
                {active.map((b, i) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="table-td text-slate-400 text-sm">{i + 1}</td>
                    <td className="table-td">
                      <Link href={`/dashboard/members/${b.member.id}`} className="font-medium text-slate-800 hover:text-sky-600">
                        {b.member.firstName} {b.member.lastName}
                      </Link>
                      <p className="text-xs text-slate-400">{b.member.memberNumber}</p>
                    </td>
                    <td className="table-td">
                      <span className={`badge ${b.member.status === "ACTIVE" ? "badge-green" : "badge-yellow"}`}>
                        {b.member.status}
                      </span>
                    </td>
                    <td className="table-td text-slate-500 text-sm">{formatDate(b.bookedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {cancelled.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="section-title">Cancelled ({cancelled.length})</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {cancelled.map((b) => (
              <div key={b.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 line-through">{b.member.firstName} {b.member.lastName}</p>
                  <p className="text-xs text-slate-400">{b.member.email}</p>
                </div>
                {b.cancelledAt && <p className="text-xs text-slate-400">Cancelled {formatDate(b.cancelledAt)}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
