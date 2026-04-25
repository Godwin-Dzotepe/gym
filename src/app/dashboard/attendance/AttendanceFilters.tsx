"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Search, Filter, X } from "lucide-react";

const METHODS = ["", "PIN", "QR_CODE", "BARCODE", "NAME_SEARCH", "MANUAL", "MASS_CHECKIN"];
const METHOD_LABELS: Record<string, string> = {
  "": "All Methods", PIN: "PIN", QR_CODE: "QR Code", BARCODE: "Barcode",
  NAME_SEARCH: "Name Search", MANUAL: "Manual", MASS_CHECKIN: "Mass Check-in",
};

interface Props {
  current: { from?: string; to?: string; method?: string; search?: string };
}

export default function AttendanceFilters({ current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [from,   setFrom]   = useState(current.from   ?? "");
  const [to,     setTo]     = useState(current.to     ?? "");
  const [method, setMethod] = useState(current.method ?? "");
  const [search, setSearch] = useState(current.search ?? "");

  function apply() {
    const p = new URLSearchParams();
    if (from)   p.set("from",   from);
    if (to)     p.set("to",     to);
    if (method) p.set("method", method);
    if (search) p.set("search", search);
    router.push(`${pathname}?${p.toString()}`);
  }

  function clear() {
    setFrom(""); setTo(""); setMethod(""); setSearch("");
    router.push(pathname);
  }

  const isFiltered = !!(current.from || current.to || current.method || current.search);

  return (
    <div className="card p-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="form-group mb-0 flex-1 min-w-36">
          <label className="label text-xs">From</label>
          <input type="date" className="input text-sm" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="form-group mb-0 flex-1 min-w-36">
          <label className="label text-xs">To</label>
          <input type="date" className="input text-sm" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <div className="form-group mb-0 flex-1 min-w-36">
          <label className="label text-xs">Method</label>
          <select className="select text-sm" value={method} onChange={e => setMethod(e.target.value)}>
            {METHODS.map(m => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
          </select>
        </div>
        <div className="form-group mb-0 flex-1 min-w-48">
          <label className="label text-xs">Member Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input className="input pl-8 text-sm" placeholder="Name or member #"
              value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && apply()} />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={apply} className="btn-primary text-sm">
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
          {isFiltered && (
            <button onClick={clear} className="btn-secondary text-sm">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
