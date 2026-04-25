import { prisma } from "@/lib/prisma";
import { getGymCurrency } from "@/lib/currency";
import { notFound } from "next/navigation";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import Link from "next/link";
import {
  Phone, Mail, MapPin, Shield, Calendar, CreditCard,
  Clock, Edit, CheckCircle2, AlertTriangle, Trophy,
  ClipboardList, ArrowLeft, Key, Users, FileText,
} from "lucide-react";
import MemberActions from "@/components/members/MemberActions";
import MemberMemberships from "@/components/members/MemberMemberships";
import MemberPayments from "@/components/members/MemberPayments";
import MemberFamilyAccount from "@/components/members/MemberFamilyAccount";
import CreateChargeButton from "@/components/billing/CreateChargeButton";
import MemberPhotoUpload from "@/components/members/MemberPhotoUpload";
import WaiverButton from "@/components/members/WaiverButton";

interface Props { params: Promise<{ id: string }> }

export default async function MemberProfilePage({ params }: Props) {
  const { id } = await params;

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      memberPlans: {
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { payments: true },
      },
      attendances: {
        orderBy: { checkedInAt: "desc" },
        take: 10,
        include: { class: { select: { title: true } } },
      },
      beltRanks: {
        include: { rank: true },
        orderBy: { awardedAt: "desc" },
      },
      familyMemberships: {
        include: {
          family: {
            include: {
              members: {
                include: { member: { select: { id: true, firstName: true, lastName: true, status: true } } },
              },
            },
          },
        },
      },
      _count: { select: { attendances: true, invoices: true } },
    },
  });

  if (!member) notFound();

  const currency = await getGymCurrency();
  const activePlan = member.memberPlans.find((p) => p.isActive);
  const unpaidCount = member.invoices.filter((i) => ["PENDING", "FAILED"].includes(i.status)).length;
  const totalPaid = member.invoices
    .filter(i => i.status === "PAID")
    .reduce((sum, i) => sum + Number(i.total), 0);

  const lastVisit = member.attendances[0]?.checkedInAt;

  const statusConfig: Record<string, { label: string; badge: string }> = {
    ACTIVE:    { label: "Active",    badge: "badge-green" },
    PENDING:   { label: "Pending",   badge: "badge-yellow" },
    FROZEN:    { label: "Frozen",    badge: "badge-blue" },
    CANCELLED: { label: "Cancelled", badge: "badge-red" },
  };
  const sc = statusConfig[member.status] ?? statusConfig.PENDING;
  const myFamilyMembership = member.familyMemberships[0];
  const family = myFamilyMembership?.family ?? null;
  const isPrimaryInFamily = myFamilyMembership?.isPrimary ?? false;

  return (
    <div className="space-y-5 max-w-6xl">
      <Link href="/dashboard/members" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-3.5 h-3.5" /> All Members
      </Link>

      {/* Profile Header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
          <MemberPhotoUpload memberId={member.id} photoUrl={member.profilePhoto} initials={getInitials(member.firstName, member.lastName)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{member.firstName} {member.lastName}</h1>
              <span className={`badge ${sc.badge}`}>{sc.label}</span>
              {unpaidCount > 0 && (
                <span className="badge badge-red"><AlertTriangle className="w-3 h-3" /> {unpaidCount} Unpaid</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-4 mt-2">
              {member.phone && (
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-gray-400" /> {member.phone}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-sm text-gray-600">
                <Mail className="w-3.5 h-3.5 text-gray-400" /> {member.email}
              </span>
              {member.gender && (
                <span className="text-sm text-gray-500 capitalize">{member.gender}</span>
              )}
            </div>

            {/* Waiver */}
            <div className="mt-2">
              <WaiverButton memberId={member.id} waiverSigned={member.waiverSigned} waiverSignedAt={member.waiverSignedAt?.toISOString() ?? null} />
            </div>

            {/* Check-in Code */}
            {(member.checkinCode || member.pinCode) && (
              <div className="mt-3 flex items-center gap-2">
                <div className="bg-gray-900 text-white px-3 py-1.5 rounded-xl text-base sm:text-xl font-mono font-bold tracking-widest">
                  {member.checkinCode ?? member.pinCode}
                </div>
                <span className="text-xs text-gray-400">Check-in code</span>
              </div>
            )}
          </div>
          <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 flex-wrap">
            <MemberActions memberId={member.id} memberStatus={member.status} />
            <Link href={`/dashboard/members/${member.id}/edit`}
              className="btn-secondary text-xs">
              <Edit className="w-3.5 h-3.5" /> Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Sessions", value: member._count.attendances.toString(), icon: ClipboardList, card: "bg-sky-500 hover:bg-sky-600",     iconBg: "bg-sky-400/30" },
          { label: "Total Paid",     value: formatCurrency(totalPaid, currency),            icon: CheckCircle2,  card: "bg-emerald-500 hover:bg-emerald-600", iconBg: "bg-emerald-400/30" },
          { label: "Last Visit",     value: lastVisit ? formatDate(lastVisit) : "Never", icon: Clock, card: "bg-orange-500 hover:bg-orange-600",  iconBg: "bg-orange-400/30" },
          { label: "Balance",        value: formatCurrency(Number(member.balance), currency), icon: CreditCard, card: "bg-violet-500 hover:bg-violet-600",  iconBg: "bg-violet-400/30" },
        ].map((s) => (
          <div key={s.label} className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-colors cursor-default shadow-sm ${s.card}`}>
            <s.icon className="absolute -right-3 -bottom-3 w-14 sm:w-20 h-14 sm:h-20 text-white opacity-10 pointer-events-none" strokeWidth={1} />
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${s.iconBg} flex items-center justify-center mb-2 sm:mb-3`}>
              <s.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/70">{s.label}</p>
            <p className="text-lg sm:text-2xl font-bold text-white mt-1 leading-none truncate">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Memberships + Payments + Attendance */}
        <div className="lg:col-span-2 space-y-5">

          {/* Memberships */}
          <MemberMemberships
            memberId={member.id}
            memberPlans={member.memberPlans.map(mp => ({
              id: mp.id,
              planName: mp.plan.name,
              planType: mp.plan.planType,
              price: Number(mp.plan.price),
              billingCycle: mp.plan.billingCycle,
              startDate: mp.startDate.toISOString(),
              endDate: mp.endDate?.toISOString() ?? null,
              paymentMethod: mp.paymentMethod,
              isActive: mp.isActive,
              isFrozen: mp.isFrozen,
              isPaused: mp.isPaused,
              cancelledAt: mp.cancelledAt?.toISOString() ?? null,
            }))}
          />

          {/* Payments */}
          <MemberPayments
            memberId={member.id}
            invoices={member.invoices.map(inv => ({
              id: inv.id,
              invoiceNumber: inv.invoiceNumber,
              description: inv.description,
              total: Number(inv.total),
              status: inv.status,
              paymentMethod: inv.paymentMethod,
              dueDate: inv.dueDate.toISOString(),
              paidAt: inv.paidAt?.toISOString() ?? null,
            }))}
          />

          {/* Attendance */}
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="section-title">Attendance History</h2>
              <span className="text-xs text-gray-400">{member._count.attendances} total sessions</span>
            </div>
            <div className="divide-y divide-gray-50">
              {member.attendances.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No check-ins recorded</p>
              ) : member.attendances.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-7 h-7 rounded-full bg-sky-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{a.class?.title ?? <span className="text-gray-400 italic">Open floor</span>}</p>
                    <p className="text-xs text-gray-400">{formatDate(a.checkedInAt, "EEE, MMM d · h:mm a")}</p>
                  </div>
                  <span className="badge badge-gray text-[10px]">{a.method.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Details + Family + Ranks + Notes */}
        <div className="space-y-5">
          {/* Member Details */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Personal Details</h2>
              <Link href={`/dashboard/members/${member.id}/edit`} className="text-xs text-indigo-600 hover:text-indigo-700">Edit</Link>
            </div>
            <dl className="space-y-3">
              {[
                { label: "Member #", value: member.memberNumber },
                { label: "Date of Birth", value: member.dateOfBirth ? formatDate(member.dateOfBirth) : "—" },
                { label: "Gender", value: member.gender ?? "—" },
                { label: "Phone", value: member.phone ?? "—" },
                { label: "City", value: member.city ?? "—" },
                { label: "Joined", value: formatDate(member.createdAt) },
                { label: "Waiver", value: member.waiverSigned ? "Signed" : "Not signed" },
              ].map((f) => (
                <div key={f.label} className="flex justify-between items-start gap-2">
                  <dt className="text-xs text-gray-400 font-medium flex-shrink-0">{f.label}</dt>
                  <dd className="text-sm text-gray-700 text-right">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Family Account */}
          <MemberFamilyAccount
            memberId={member.id}
            lastName={member.lastName}
            isPrimary={isPrimaryInFamily}
            activePlanId={activePlan?.planId}
            family={family ? {
              id: family.id,
              name: family.name,
              members: family.members.map(fm => ({
                id: fm.id,
                memberId: fm.memberId,
                isPrimary: fm.isPrimary,
                relationship: fm.relationship,
                name: `${fm.member.firstName} ${fm.member.lastName}`,
                status: fm.member.status,
              })),
            } : null}
          />

          {/* Emergency Contact */}
          {(member.emergencyName || member.emergencyPhone) && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-gray-400" />
                <h2 className="section-title">Emergency Contact</h2>
              </div>
              <dl className="space-y-2">
                {member.emergencyName && <div className="flex justify-between"><dt className="text-xs text-gray-400">Name</dt><dd className="text-sm text-gray-700">{member.emergencyName}</dd></div>}
                {member.emergencyPhone && <div className="flex justify-between"><dt className="text-xs text-gray-400">Phone</dt><dd className="text-sm text-gray-700">{member.emergencyPhone}</dd></div>}
                {member.emergencyRelation && <div className="flex justify-between"><dt className="text-xs text-gray-400">Relation</dt><dd className="text-sm text-gray-700">{member.emergencyRelation}</dd></div>}
              </dl>
            </div>
          )}

          {/* Ranks */}
          {member.beltRanks.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <h2 className="section-title">Belt Ranks</h2>
              </div>
              <div className="space-y-2">
                {member.beltRanks.slice(0, 3).map((br, i) => (
                  <div key={br.id} className={`flex items-center gap-2 ${i === 0 ? "opacity-100" : "opacity-50"}`}>
                    {br.rank.color && <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: br.rank.color }} />}
                    <span className="text-sm text-gray-700">{br.rank.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{formatDate(br.awardedAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {member.notes && (
            <div className="card p-5">
              <h2 className="section-title mb-2">Staff Notes</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{member.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
