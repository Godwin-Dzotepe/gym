"use client";

import { useEffect, useState, useCallback } from "react";
import { useFormatCurrency } from "@/components/providers/CurrencyProvider";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Calendar } from "lucide-react";

type Period = "today" | "last_week" | "last_month" | "this_quarter" | "this_year" | "custom";

interface Accounting {
  totalRevenue: number;
  baseAmount: number;
  taxesAndFees: number;
  refunds: number;
  chart: Array<{ label: string; revenue: number }>;
}

const PERIODS: { key: Period; label: string }[] = [
  { key: "today",        label: "Today" },
  { key: "last_week",    label: "Last Week" },
  { key: "last_month",   label: "Last Month" },
  { key: "this_quarter", label: "This Quarter" },
  { key: "this_year",    label: "This Year" },
  { key: "custom",       label: "Custom Range" },
];

function toLocalDateStr(d: Date) {
  // Returns YYYY-MM-DD in local time (for <input type="date">)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getPeriodRange(period: Period): { start: Date; end: Date } {
  const now  = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "today":
      return { start: today, end: now };

    case "last_week": {
      const s = new Date(today);
      s.setDate(today.getDate() - 6);
      return { start: s, end: now };
    }

    case "last_month": {
      const s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const e = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: s, end: e };
    }

    case "this_quarter": {
      const q = Math.floor(today.getMonth() / 3);
      const s = new Date(today.getFullYear(), q * 3, 1);
      return { start: s, end: now };
    }

    case "this_year": {
      const s = new Date(today.getFullYear(), 0, 1);
      return { start: s, end: now };
    }

    default:
      return { start: today, end: now };
  }
}

function formatRangeLabel(period: Period, start: Date, end: Date): string {
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  if (period === "today") return `Today — ${fmt(start)}`;
  return `${fmt(start)} — ${fmt(end)}`;
}

export default function AccountingTab() {
  const formatCurrency = useFormatCurrency();
  const [data, setData]       = useState<Accounting | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod]   = useState<Period>("this_month" as Period);

  // Initialise to "this_year" by default
  const [activePeriod, setActivePeriod]   = useState<Period>("this_year");
  const [rangeLabel, setRangeLabel]       = useState("");
  const [customStart, setCustomStart]     = useState(toLocalDateStr(new Date(new Date().getFullYear(), 0, 1)));
  const [customEnd, setCustomEnd]         = useState(toLocalDateStr(new Date()));
  const [showCustom, setShowCustom]       = useState(false);

  const fetchData = useCallback((start: Date, end: Date) => {
    setLoading(true);
    setData(null);
    fetch(`/api/billing/accounting?start=${start.toISOString()}&end=${end.toISOString()}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const applyPeriod = useCallback((p: Period) => {
    setActivePeriod(p);
    if (p === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    const { start, end } = getPeriodRange(p);
    setRangeLabel(formatRangeLabel(p, start, end));
    fetchData(start, end);
  }, [fetchData]);

  const applyCustom = useCallback(() => {
    if (!customStart || !customEnd) return;
    const start = new Date(customStart);
    const end   = new Date(customEnd);
    if (start > end) return;
    setRangeLabel(formatRangeLabel("custom", start, end));
    fetchData(start, end);
  }, [customStart, customEnd, fetchData]);

  // Load default on mount
  useEffect(() => {
    applyPeriod("this_year");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cards = data ? [
    { label: "Total Revenue", value: data.totalRevenue, color: "text-green-600",  bg: "bg-green-50"  },
    { label: "Base Amount",   value: data.baseAmount,   color: "text-blue-600",   bg: "bg-blue-50"   },
    { label: "Taxes & Fees",  value: data.taxesAndFees, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Refunds",       value: data.refunds,      color: "text-red-600",    bg: "bg-red-50"    },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Accounting Overview</h2>
          {rangeLabel && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {rangeLabel}
            </span>
          )}
        </div>

        {/* Period pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 flex-wrap sm:flex-nowrap" style={{scrollbarWidth:"none"}}>
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => applyPeriod(p.key)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                activePeriod === p.key
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
              }`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom range picker */}
        {showCustom && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                className="input text-sm py-1.5 px-3 w-auto"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="date"
                className="input text-sm py-1.5 px-3 w-auto"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
              />
              <button
                onClick={applyCustom}
                disabled={!customStart || !customEnd}
                className="btn-primary text-sm py-1.5 px-4">
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-24 mb-3" />
              <div className="h-7 bg-gray-100 rounded w-32" />
            </div>
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(c => (
            <div key={c.label} className={`card p-5 ${c.bg}`}>
              <p className="text-xs text-gray-500 font-medium mb-1">{c.label}</p>
              <p className={`text-2xl font-bold ${c.color}`}>{formatCurrency(c.value)}</p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Chart */}
      {loading ? (
        <div className="card p-5 animate-pulse h-72" />
      ) : data && data.chart.length > 0 ? (
        <div className="card p-5">
          <h3 className="font-medium text-gray-700 mb-4">Revenue</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.chart} margin={{ left: 0, right: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                interval={data.chart.length > 14 ? Math.floor(data.chart.length / 10) : 0}
              />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} width={48} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : data && data.chart.length === 0 ? (
        <div className="card p-10 text-center text-gray-400 text-sm">No revenue data for this period</div>
      ) : null}
    </div>
  );
}
