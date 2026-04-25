"use client";

import { useEffect, useState } from "react";
import { useFormatCurrency } from "@/components/providers/CurrencyProvider";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Accounting {
  totalRevenue: number;
  baseAmount: number;
  taxesAndFees: number;
  refunds: number;
  monthly: Array<{ month: string; revenue: number }>;
}

export default function AccountingTab() {
  const formatCurrency = useFormatCurrency();
  const [data, setData] = useState<Accounting | null>(null);
  const [range, setRange] = useState("30");

  useEffect(() => {
    fetch(`/api/billing/accounting?days=${range}`)
      .then(r => r.json()).then(setData);
  }, [range]);

  if (!data) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />;

  const cards = [
    { label: "Total Revenue", value: data.totalRevenue, color: "text-green-600" },
    { label: "Base Amount", value: data.baseAmount, color: "text-blue-600" },
    { label: "Taxes & Fees", value: data.taxesAndFees, color: "text-orange-600" },
    { label: "Refunds", value: data.refunds, color: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Accounting Overview</h2>
        <select className="select text-sm w-auto"
          value={range} onChange={e => setRange(e.target.value)}>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="180">Last 6 months</option>
          <option value="365">Last year</option>
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <p className="text-xs text-gray-500 font-medium mb-1">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{formatCurrency(c.value)}</p>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <h3 className="font-medium text-gray-700 mb-4">Revenue</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `¢${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => formatCurrency(Number(v))} />
            <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
