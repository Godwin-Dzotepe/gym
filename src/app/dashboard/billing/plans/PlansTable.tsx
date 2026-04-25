"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Edit, Trash2, ToggleLeft, ToggleRight, Users, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useFormatCurrency } from "@/components/providers/CurrencyProvider";

const PLAN_TYPE_BADGE: Record<string, string> = {
  RECURRING: "bg-blue-100 text-blue-700",
  ONE_TIME: "bg-purple-100 text-purple-700",
  PER_SESSION: "bg-orange-100 text-orange-700",
  TRIAL: "bg-yellow-100 text-yellow-700",
};

const CYCLE_LABEL: Record<string, string> = {
  DAILY: "/day", WEEKLY: "/wk", MONTHLY: "/mo", YEARLY: "/yr",
};

interface Plan {
  id: string; name: string; planType: string; billingCycle: string;
  price: number; isActive: boolean; isFamilyShared: boolean;
  accessLimit: number | null; durationType: string; duration: number | null;
  memberCount: number; activeCount: number;
}

export default function PlansTable({ plans: initial }: { plans: Plan[] }) {
  const formatCurrency = useFormatCurrency();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [plans, setPlans] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);

  async function toggleActive(plan: Plan) {
    setLoading(plan.id);
    const res = await fetch(`/api/plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !plan.isActive }),
    });
    setLoading(null);
    if (!res.ok) { toast.error("Failed to update plan."); return; }
    setPlans(p => p.map(pl => pl.id === plan.id ? { ...pl, isActive: !pl.isActive } : pl));
    toast.success(plan.isActive ? "Plan deactivated." : "Plan activated.");
  }

  async function deletePlan(plan: Plan) {
    const ok = await confirm({
      title: "Delete Plan?",
      message: `"${plan.name}" will be permanently deleted. Members on this plan will lose access.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/plans/${plan.id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to delete plan."); return; }
    setPlans(p => p.filter(pl => pl.id !== plan.id));
    toast.success("Plan deleted.");
    router.refresh();
  }

  if (plans.length === 0) {
    return (
      <tr><td colSpan={9} className="table-td text-center py-12 text-gray-400">
        No plans yet. <Link href="/dashboard/billing/plans/new" className="text-indigo-600 hover:underline">Create your first plan →</Link>
      </td></tr>
    );
  }

  return (
    <>
      {plans.map((plan) => (
        <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
          <td className="table-td">
            <div>
              <p className="font-semibold text-gray-900">{plan.name}</p>
              {plan.isFamilyShared && <span className="text-xs text-indigo-600 font-medium">Family Shared</span>}
            </div>
          </td>
          <td className="table-td">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLAN_TYPE_BADGE[plan.planType] ?? "bg-gray-100 text-gray-600"}`}>
              {plan.planType.charAt(0) + plan.planType.slice(1).toLowerCase().replace("_", "-")}
            </span>
          </td>
          <td className="table-td text-sm text-gray-600">
            {plan.accessLimit ? `${plan.accessLimit}x/mo` : "Unlimited"}
          </td>
          <td className="table-td font-semibold text-gray-900">
            {formatCurrency(plan.price)}
            {plan.planType === "RECURRING" && (
              <span className="text-gray-400 text-xs ml-1">{CYCLE_LABEL[plan.billingCycle]}</span>
            )}
          </td>
          <td className="table-td text-sm text-gray-500">
            {plan.durationType === "ONGOING" ? "Ongoing" :
             plan.durationType === "LIMITED" ? `${plan.duration} ${plan.billingCycle.toLowerCase()}(s)` : "Custom"}
          </td>
          <td className="table-td">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Users className="w-3.5 h-3.5 text-gray-400" />{plan.memberCount}
            </div>
          </td>
          <td className="table-td text-sm font-medium text-green-600">{plan.activeCount}</td>
          <td className="table-td">
            <span className={`badge ${plan.isActive ? "badge-green" : "badge-gray"}`}>
              {plan.isActive ? "Active" : "Inactive"}
            </span>
          </td>
          <td className="table-td">
            <div className="flex items-center gap-1">
              <Link href={`/dashboard/billing/plans/${plan.id}/edit`} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50">
                <Edit className="w-3.5 h-3.5" />
              </Link>
              <button onClick={() => toggleActive(plan)} disabled={loading === plan.id}
                className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                title={plan.isActive ? "Deactivate" : "Activate"}>
                {loading === plan.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                  plan.isActive ? <ToggleRight className="w-3.5 h-3.5 text-green-500" /> : <ToggleLeft className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => deletePlan(plan)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}
