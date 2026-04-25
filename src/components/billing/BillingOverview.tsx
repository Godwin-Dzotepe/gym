"use client";

import { useEffect, useState } from "react";
import { useFormatCurrency } from "@/components/providers/CurrencyProvider";
import Link from "next/link";
import { TrendingUp, Clock, AlertCircle, CheckCircle } from "lucide-react";

interface Stats {
  totalRevenue: number;
  paid: number;
  scheduled: number;
  overdue: number;
  recentPayments: Array<{
    id: string;
    invoiceNumber: string;
    memberName: string;
    amount: number;
    paidAt: string | null;
    status: string;
    paymentMethod: string;
  }>;
}

export default function BillingOverview() {
  const formatCurrency = useFormatCurrency();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/billing/overview").then(r => r.json()).then(setStats);
  }, []);

  if (!stats) return <div className="animate-pulse space-y-4"><div className="h-32 bg-gray-100 rounded-xl"/><div className="h-64 bg-gray-100 rounded-xl"/></div>;

  const cards = [
    { label: "Total Revenue", value: formatCurrency(stats.totalRevenue), icon: TrendingUp, card: "bg-emerald-500 hover:bg-emerald-600", iconBg: "bg-emerald-400/30" },
    { label: "Paid", value: formatCurrency(stats.paid), icon: CheckCircle, card: "bg-sky-500 hover:bg-sky-600", iconBg: "bg-sky-400/30" },
    { label: "Scheduled", value: formatCurrency(stats.scheduled), icon: Clock, card: "bg-yellow-500 hover:bg-yellow-600", iconBg: "bg-yellow-400/30" },
    { label: "Overdue", value: formatCurrency(stats.overdue), icon: AlertCircle, card: "bg-red-500 hover:bg-red-600", iconBg: "bg-red-400/30" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`relative overflow-hidden rounded-2xl p-5 transition-colors cursor-default shadow-sm ${c.card}`}>
            <c.icon className="absolute -right-3 -bottom-3 w-20 h-20 text-white opacity-10 pointer-events-none" strokeWidth={1} />
            <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center mb-3`}>
              <c.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{c.label}</p>
            <p className="text-2xl font-bold text-white mt-1 leading-none">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Payments */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Payments</h2>
          <Link href="/dashboard/billing?tab=payments" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            All Payments →
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {stats.recentPayments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No payments yet</p>
          ) : stats.recentPayments.map((p) => (
            <div key={p.id} className="px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                  {p.memberName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.memberName}</p>
                  <p className="text-xs text-gray-400">{p.paymentMethod} · {p.invoiceNumber}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(p.amount)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  p.status === "PAID" ? "bg-green-100 text-green-700" :
                  p.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                }`}>{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
