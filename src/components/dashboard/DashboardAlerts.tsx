"use client";

import { AlertTriangle, Clock, UserCog } from "lucide-react";
import Link from "next/link";

interface ExpiringPlan {
  member: { firstName: string; lastName: string; email: string };
  plan: { name: string };
  endDate: Date | null;
}

interface Props {
  failedInvoices: number;
  pendingMembers: number;
  expiringPlans: ExpiringPlan[];
}

export default function DashboardAlerts({ failedInvoices, pendingMembers, expiringPlans }: Props) {
  const alerts = [
    failedInvoices > 0 && {
      type: "error",
      icon: AlertTriangle,
      title: `${failedInvoices} Failed Payment${failedInvoices > 1 ? "s" : ""}`,
      message: "Members with failed invoices need attention.",
      link: "/dashboard/billing?status=failed",
      linkText: "View invoices",
    },
    pendingMembers > 0 && {
      type: "warning",
      icon: UserCog,
      title: `${pendingMembers} Pending Member${pendingMembers > 1 ? "s" : ""}`,
      message: "New registrations awaiting activation.",
      link: "/dashboard/members?status=pending",
      linkText: "Review members",
    },
    expiringPlans.length > 0 && {
      type: "warning",
      icon: Clock,
      title: `${expiringPlans.length} Membership${expiringPlans.length > 1 ? "s" : ""} Expiring`,
      message: "Plans expiring within the next 7 days.",
      link: "/dashboard/billing/plans",
      linkText: "View plans",
    },
  ].filter(Boolean) as {
    type: string;
    icon: React.ElementType;
    title: string;
    message: string;
    link: string;
    linkText: string;
  }[];

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={`flex items-start gap-3 p-4 rounded-xl border ${
            alert.type === "error"
              ? "bg-red-50 border-red-200"
              : "bg-yellow-50 border-yellow-200"
          }`}
        >
          <alert.icon
            className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
              alert.type === "error" ? "text-red-500" : "text-yellow-500"
            }`}
          />
          <div className="flex-1">
            <p className={`text-sm font-semibold ${
              alert.type === "error" ? "text-red-800" : "text-yellow-800"
            }`}>
              {alert.title}
            </p>
            <p className={`text-xs mt-0.5 ${
              alert.type === "error" ? "text-red-600" : "text-yellow-700"
            }`}>
              {alert.message}
            </p>
          </div>
          <Link
            href={alert.link}
            className={`text-xs font-medium flex-shrink-0 ${
              alert.type === "error"
                ? "text-red-600 hover:text-red-700"
                : "text-yellow-700 hover:text-yellow-800"
            }`}
          >
            {alert.linkText} →
          </Link>
        </div>
      ))}
    </div>
  );
}
