import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreditCard, Calendar, CheckCircle, AlertCircle, Trophy } from "lucide-react";
import Link from "next/link";

export default async function PortalOverviewPage() {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId;

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      memberPlans: {
        where: { isActive: true },
        include: { plan: true },
        take: 1,
      },
      invoices: {
        where: { status: { in: ["PENDING", "FAILED"] } },
        orderBy: { dueDate: "asc" },
        take: 3,
      },
      attendances: {
        orderBy: { checkedInAt: "desc" },
        take: 5,
      },
      beltRanks: {
        include: { rank: true },
        orderBy: { awardedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!member) return <div className="text-center py-20 text-gray-400">Member not found.</div>;

  const activePlan = member.memberPlans[0];
  const hasUnpaid = member.invoices.length > 0;
  const currentRank = member.beltRanks[0]?.rank;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-4 sm:p-6 text-white">
        <p className="text-indigo-200 text-sm">Welcome back,</p>
        <h1 className="text-xl sm:text-2xl font-bold mt-1">{member.firstName} {member.lastName}</h1>
        <p className="text-indigo-200 text-sm mt-1">Member #{member.memberNumber}</p>

        <div className="flex items-center gap-3 mt-4">
          <span className={`badge ${
            member.status === "ACTIVE" ? "bg-green-500/20 text-green-200 border-green-500/30" :
            "bg-red-500/20 text-red-200 border-red-500/30"
          }`}>
            {member.status}
          </span>
          {activePlan && (
            <span className="badge bg-white/20 text-white border-white/30">
              {activePlan.plan.name}
            </span>
          )}
        </div>
      </div>

      {/* Unpaid Alert */}
      {hasUnpaid && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-semibold text-sm">Outstanding Payment</p>
            <p className="text-red-600 text-xs mt-0.5">
              You have {member.invoices.length} unpaid invoice(s). Please settle to avoid access restrictions.
            </p>
          </div>
          <Link href="/portal/payments" className="text-xs text-red-600 font-medium hover:text-red-700 whitespace-nowrap">
            Pay now →
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{member.attendances.length}</p>
          <p className="text-xs text-gray-500 mt-1">Sessions Attended</p>
        </div>
        <div className="card p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {activePlan?.endDate ? formatDate(activePlan.endDate, "MMM d") : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-1">Plan Expires</p>
        </div>
        <div className="card p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{member.invoices.length}</p>
          <p className="text-xs text-gray-500 mt-1">Unpaid Invoices</p>
        </div>
        <div className="card p-3 sm:p-4 text-center">
          <p className="text-sm font-bold text-gray-900 truncate">{currentRank?.name ?? "—"}</p>
          <p className="text-xs text-gray-500 mt-1">Current Rank</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { href: "/portal/payments", label: "View Invoices", icon: CreditCard, color: "text-indigo-600 bg-indigo-50" },
          { href: "/portal/classes", label: "Book a Class", icon: Calendar, color: "text-green-600 bg-green-50" },
          { href: "/portal/attendance", label: "My Attendance", icon: CheckCircle, color: "text-blue-600 bg-blue-50" },
          { href: "/portal/progress", label: "My Progress", icon: Trophy, color: "text-yellow-600 bg-yellow-50" },
        ].map((q) => (
          <Link key={q.href} href={q.href}
            className="card p-3 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-2 hover:shadow-md transition-shadow text-center">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${q.color}`}>
              <q.icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-700 leading-tight">{q.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="card p-5">
        <h2 className="section-title mb-4">Recent Check-ins</h2>
        {member.attendances.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No check-ins recorded yet</p>
        ) : (
          <div className="space-y-3">
            {member.attendances.map((a) => (
              <div key={a.id} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Checked in</p>
                  <p className="text-xs text-gray-500">{formatDate(a.checkedInAt, "EEE, MMM d · h:mm a")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
