import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import PlansTable from "./PlansTable";


export default async function PlansPage() {
  const plans = await prisma.plan.findMany({
    include: {
      _count: {
        select: {
          memberPlans: true,
          // active only via where
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get active member counts separately
  const activeCounts = await prisma.memberPlan.groupBy({
    by: ["planId"],
    where: { isActive: true },
    _count: true,
  });
  const activeMap = Object.fromEntries(activeCounts.map(a => [a.planId, a._count]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Membership Plans</h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage membership tiers</p>
        </div>
        <Link href="/dashboard/billing/plans/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Add Membership
        </Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="table-th">Title</th>
              <th className="table-th">Type</th>
              <th className="table-th">Access</th>
              <th className="table-th">Price</th>
              <th className="table-th">Duration</th>
              <th className="table-th">Enrolled</th>
              <th className="table-th">Active</th>
              <th className="table-th">Status</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            <PlansTable plans={plans.map(p => ({
              id: p.id, name: p.name, planType: p.planType, billingCycle: p.billingCycle,
              price: Number(p.price), isActive: p.isActive, isFamilyShared: p.isFamilyShared,
              accessLimit: p.accessLimit, durationType: p.durationType, duration: p.duration,
              memberCount: p._count.memberPlans,
              activeCount: activeMap[p.id] ?? 0,
            }))} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
