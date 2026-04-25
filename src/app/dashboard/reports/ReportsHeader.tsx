"use client";

import { useState } from "react";
import { Download, Calendar } from "lucide-react";

export default function ReportsHeader() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [exporting, setExporting] = useState(false);

  async function exportReport() {
    setExporting(true);
    const res = await fetch(`/api/reports/export?from=${from}&to=${to}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 className="page-title">Reports & Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Business insights and performance metrics</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="text-sm text-gray-700 border-0 outline-none bg-transparent" />
          <span className="text-gray-400 text-sm">→</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="text-sm text-gray-700 border-0 outline-none bg-transparent" />
        </div>
        <button onClick={exportReport} disabled={exporting} className="btn-primary">
          <Download className="w-4 h-4" />
          {exporting ? "Exporting…" : "Export CSV"}
        </button>
      </div>
    </div>
  );
}
