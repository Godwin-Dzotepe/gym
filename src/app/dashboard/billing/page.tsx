import { prisma } from "@/lib/prisma";
import { getGymCurrency } from "@/lib/currency";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Download, Plus } from "lucide-react";
import BillingOverview from "@/components/billing/BillingOverview";
import PaymentsTable from "@/components/billing/PaymentsTable";
import RecurringTab from "@/components/billing/RecurringTab";
import AccountingTab from "@/components/billing/AccountingTab";
import DiscountsTab from "@/components/billing/DiscountsTab";

interface Props {
  searchParams: Promise<{ tab?: string; status?: string }>;
}

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "payments", label: "Payments" },
  { key: "recurring", label: "Recurring" },
  { key: "discounts", label: "Discounts" },
  { key: "accounting", label: "Accounting" },
];

export default async function BillingPage({ searchParams }: Props) {
  const params = await searchParams;
  const tab = params.tab ?? "overview";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Billing</h1>
          <p className="text-gray-500 text-sm mt-1">Manage payments, invoices and recurring billing</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/billing/plans" className="btn-secondary">Membership Plans</Link>
          <Link href="/dashboard/billing/new" className="btn-primary">
            <Plus className="w-4 h-4" /> New Invoice
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto" style={{scrollbarWidth:"none",WebkitOverflowScrolling:"touch"}}>
        {TABS.map((t) => (
          <Link key={t.key}
            href={`/dashboard/billing?tab=${t.key}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "overview" && <BillingOverview />}
      {tab === "payments" && <PaymentsTable status={params.status} />}
      {tab === "recurring" && <RecurringTab />}
      {tab === "discounts" && <DiscountsTab />}
      {tab === "accounting" && <AccountingTab />}
    </div>
  );
}
