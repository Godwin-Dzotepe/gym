"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useFormatCurrency } from "@/components/providers/CurrencyProvider";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Calendar } from "lucide-react";

type Period =
  | "today" | "this_week" | "last_week"
  | "this_month" | "last_month"
  | "this_quarter" | "this_year"
  | "last_year" | "last_2_years" | "custom";

interface Accounting {
  totalRevenue: number;
  baseAmount: number;
  taxesAndFees: number;
  refunds: number;
  chart: Array<{ label: string; revenue: number }>;
}

const PERIODS: { value: Period; label: string }[] = [
  { value: "today",        label: "Today"         },
  { value: "this_week",    label: "This Week"     },
  { value: "last_week",    label: "Last Week"     },
  { value: "this_month",   label: "This Month"    },
  { value: "last_month",   label: "Last Month"    },
  { value: "this_quarter", label: "This Quarter"  },
  { value: "this_year",    label: "This Year"     },
  { value: "last_year",    label: "Last Year"     },
  { value: "last_2_years", label: "Last 2 Years"  },
  { value: "custom",       label: "Custom Range…" },
];

function getPeriodRange(period: Exclude<Period, "custom">): { start: Date; end: Date } {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "today":
      return { start: today, end: now };

    case "this_week": {
      const day  = today.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const s    = new Date(today);
      s.setDate(today.getDate() - diff);
      return { start: s, end: now };
    }

    case "last_week": {
      const day   = today.getDay();
      const diff  = day === 0 ? 6 : day - 1;
      const end   = new Date(today); end.setDate(today.getDate() - diff - 1);
      const start = new Date(end);  start.setDate(end.getDate() - 6);
      return { start, end };
    }

    case "this_month":
      return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: now };

    case "last_month": {
      const s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const e = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: s, end: e };
    }

    case "this_quarter": {
      const q = Math.floor(today.getMonth() / 3);
      return { start: new Date(today.getFullYear(), q * 3, 1), end: now };
    }

    case "this_year":
      return { start: new Date(today.getFullYear(), 0, 1), end: now };

    case "last_year": {
      const y = today.getFullYear() - 1;
      return { start: new Date(y, 0, 1), end: new Date(y, 11, 31) };
    }

    case "last_2_years": {
      const s = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
      return { start: s, end: now };
    }
  }
}

// Parse inputs like "3 days", "2 weeks", "5 months", "1 year"
function parseCustomRange(input: string): { start: Date; end: Date } | null {
  const clean = input.trim().toLowerCase();
  const match = clean.match(/^(\d+)\s*(day|days|week|weeks|month|months|year|years)$/);
  if (!match) return null;

  const n    = parseInt(match[1], 10);
  const unit = match[2];
  const now  = new Date();
  const start = new Date(now);

  if (unit.startsWith("day"))   start.setDate(now.getDate() - n);
  if (unit.startsWith("week"))  start.setDate(now.getDate() - n * 7);
  if (unit.startsWith("month")) start.setMonth(now.getMonth() - n);
  if (unit.startsWith("year"))  start.setFullYear(now.getFullYear() - n);

  return { start, end: now };
}

function fmt(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function AccountingTab() {
  const formatCurrency = useFormatCurrency();
  const [data, setData]             = useState<Accounting | null>(null);
  const [loading, setLoading]       = useState(false);
  const [period, setPeriod]         = useState<Period>("this_year");
  const [rangeLabel, setRangeLabel] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [customError, setCustomError] = useState("");
  const customRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback((start: Date, end: Date) => {
    setLoading(true);
    setData(null);
    fetch(`/api/billing/accounting?start=${start.toISOString()}&end=${end.toISOString()}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const applyPeriod = useCallback((p: Period) => {
    setPeriod(p);
    if (p === "custom") {
      setRangeLabel("");
      setCustomInput("");
      setCustomError("");
      setTimeout(() => customRef.current?.focus(), 50);
      return;
    }
    const { start, end } = getPeriodRange(p);
    const label = PERIODS.find(x => x.value === p)?.label ?? "";
    setRangeLabel(`${label}  ·  ${fmt(start)} — ${fmt(end)}`);
    fetchData(start, end);
  }, [fetchData]);

  const applyCustom = useCallback(() => {
    const result = parseCustomRange(customInput);
    if (!result) {
      setCustomError("Try: 3 days, 2 weeks, 5 months, 1 year");
      return;
    }
    setCustomError("");
    setRangeLabel(`Last ${customInput.trim()}  ·  ${fmt(result.start)} — ${fmt(result.end)}`);
    fetchData(result.start, result.end);
  }, [customInput, fetchData]);

  useEffect(() => { applyPeriod("this_year"); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cards = data ? [
    { label: "Total Revenue", value: data.totalRevenue, color: "text-green-600",  bg: "bg-green-50"  },
    { label: "Base Amount",   value: data.baseAmount,   color: "text-blue-600",   bg: "bg-blue-50"   },
    { label: "Taxes & Fees",  value: data.taxesAndFees, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Refunds",       value: data.refunds,      color: "text-red-600",    bg: "bg-red-50"    },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">Accounting Overview</h2>
          {rangeLabel && (
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5" /> {rangeLabel}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={e => applyPeriod(e.target.value as Period)}
            className="select w-auto text-sm"
          >
            {PERIODS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          {period === "custom" && (
            <div className="flex items-center gap-1.5">
              <div className="flex flex-col">
                <input
                  ref={customRef}
                  type="text"
                  value={customInput}
                  onChange={e => { setCustomInput(e.target.value); setCustomError(""); }}
                  onKeyDown={e => e.key === "Enter" && applyCustom()}
                  placeholder="e.g. 3 days, 2 weeks"
                  className={`input text-sm w-44 ${customError ? "border-red-400 focus:ring-red-300" : ""}`}
                />
                {customError && (
                  <span className="text-xs text-red-500 mt-0.5">{customError}</span>
                )}
              </div>
              <button
                onClick={applyCustom}
                className="btn btn-primary text-sm px-3 py-1.5"
              >
                Go
              </button>
            </div>
          )}
        </div>
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
              <XAxis dataKey="label" tick={{ fontSize: 11 }}
                interval={data.chart.length > 14 ? Math.floor(data.chart.length / 10) : 0} />
              <YAxis tick={{ fontSize: 11 }} width={48}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
              <Tooltip formatter={v => formatCurrency(Number(v))} />
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
