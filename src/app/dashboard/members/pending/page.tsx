import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import PendingMemberList from "@/components/members/PendingMemberList";

export default async function PendingMembersPage() {
  const members = await prisma.member.findMany({
    where: { status: "PENDING" },
    include: {
      memberPlans: {
        where: { isActive: true },
        include: { plan: { select: { name: true, price: true } } },
        take: 1,
      },
      invoices: {
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { transactionId: true, total: true, description: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = members.map(m => ({
    id: m.id,
    memberNumber: m.memberNumber,
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
    phone: m.phone,
    gender: m.gender,
    dateOfBirth: m.dateOfBirth?.toISOString() ?? null,
    address: m.address,
    emergencyName: m.emergencyName,
    emergencyPhone: m.emergencyPhone,
    waiverSigned: m.waiverSigned,
    createdAt: m.createdAt.toISOString(),
    planName: m.memberPlans[0]?.plan.name ?? null,
    transactionId: m.invoices[0]?.transactionId ?? null,
    invoiceTotal: m.invoices[0]?.total ? Number(m.invoices[0].total) : null,
    invoiceDescription: m.invoices[0]?.description ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/members" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> All Members
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="page-title">Pending Registrations</h1>
            <p className="text-gray-500 text-sm mt-0.5">{serialized.length} member{serialized.length !== 1 ? "s" : ""} awaiting review</p>
          </div>
        </div>
      </div>

      <PendingMemberList members={serialized} />
    </div>
  );
}
