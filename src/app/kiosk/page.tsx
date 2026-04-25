"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Delete, Check, X, Search, Loader2, Lock } from "lucide-react";

type Mode = "locked" | "home" | "pin" | "name" | "success" | "error";

export default function KioskPage() {
  const [mode, setMode] = useState<Mode>("locked");
  const [lockPin, setLockPin] = useState("");
  const [lockError, setLockError] = useState("");
  const [pin, setPin] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [member, setMember] = useState<{ name: string; plan: string; status: string } | null>(null);
  const [error, setError] = useState("");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-reset after 5s on success/error
  useEffect(() => {
    if (mode === "success" || mode === "error") {
      const t = setTimeout(() => {
        setMode("home");
        setPin("");
        setSearch("");
        setMember(null);
        setError("");
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [mode]);

  async function handlePinSubmit() {
    if (pin.length !== 4) return;
    setLoading(true);
    try {
      const res = await fetch("/api/kiosk/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, method: "PIN" }),
      });
      const data = await res.json();
      if (res.ok) {
        setMember(data.member);
        setMode("success");
      } else {
        setError(data.error ?? "Check-in failed.");
        setMode("error");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleNameCheckin(memberId: string, memberName: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/kiosk/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, method: "NAME_SEARCH" }),
      });
      const data = await res.json();
      if (res.ok) {
        setMember(data.member);
        setMode("success");
      } else {
        setError(data.error ?? "Check-in failed.");
        setMode("error");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLockPin() {
    if (lockPin.length < 4) return;
    setLoading(true);
    const res = await fetch("/api/kiosk/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: lockPin }),
    });
    setLoading(false);
    if (res.ok) {
      setMode("home");
      setLockPin("");
      setLockError("");
    } else {
      setLockError("Incorrect passcode. Please try again.");
      setLockPin("");
    }
  }

  function pressKey(key: string) {
    if (pin.length < 4) setPin((p) => p + key);
  }

  function pressLockKey(key: string) {
    if (lockPin.length < 4) setLockPin((p) => p + key);
  }

  const pinDisplay = Array.from({ length: 4 }, (_, i) =>
    pin[i] ? "●" : "○"
  );

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-8 select-none">
      {/* Clock */}
      <div className="absolute top-6 right-8 text-right">
        <p className="text-white text-3xl font-light tabular-nums">
          {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
        <p className="text-gray-400 text-sm">
          {time.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <Image src="/gym-logo.png" alt="Logo" width={48} height={48} className="rounded-full border-2 border-orange-400" />
        <div>
          <p className="text-white font-bold text-2xl">THE ORACLE GYM</p>
          <p className="text-gray-400 text-sm">Member Check-in</p>
        </div>
      </div>

      {/* ── LOCKED ───────────────────────────────────────────── */}
      {mode === "locked" && (
        <div className="flex flex-col items-center gap-6 w-full max-w-xs">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
            <Lock className="w-8 h-8 text-indigo-400" />
          </div>
          <p className="text-gray-300 text-lg">Enter kiosk passcode</p>
          <div className="flex gap-4">
            {Array.from({ length: 4 }, (_, i) => (
              <span key={i} className="text-4xl text-indigo-400">{lockPin[i] ? "●" : "○"}</span>
            ))}
          </div>
          {lockError && <p className="text-red-400 text-sm text-center">{lockError}</p>}
          <div className="grid grid-cols-3 gap-3 w-full">
            {["1","2","3","4","5","6","7","8","9"].map((k) => (
              <button key={k} onClick={() => pressLockKey(k)}
                className="py-5 bg-white/10 text-white text-2xl font-semibold rounded-xl hover:bg-white/20 active:scale-95 transition-all border border-white/10">
                {k}
              </button>
            ))}
            <div />
            <button onClick={() => pressLockKey("0")}
              className="py-5 bg-white/10 text-white text-2xl font-semibold rounded-xl hover:bg-white/20 active:scale-95 transition-all border border-white/10">
              0
            </button>
            <button onClick={() => setLockPin(p => p.slice(0, -1))}
              className="py-5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center border border-white/10">
              <Delete className="w-6 h-6" />
            </button>
          </div>
          <button onClick={handleLockPin} disabled={lockPin.length < 4 || loading}
            className="w-full py-4 bg-indigo-600 text-white font-bold text-lg rounded-2xl disabled:opacity-40 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Unlock Kiosk"}
          </button>
        </div>
      )}

      {/* ── HOME ─────────────────────────────────────────────── */}
      {mode === "home" && (
        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
          <p className="text-gray-300 text-lg font-medium mb-2">How would you like to check in?</p>
          <button onClick={() => setMode("pin")}
            className="w-full py-5 bg-indigo-600 text-white text-lg font-semibold rounded-2xl hover:bg-indigo-700 transition-colors">
            Enter PIN Code
          </button>
          <button onClick={() => setMode("name")}
            className="w-full py-5 bg-white/10 text-white text-lg font-semibold rounded-2xl hover:bg-white/20 transition-colors border border-white/20">
            Search by Name
          </button>
        </div>
      )}

      {/* ── PIN ──────────────────────────────────────────────── */}
      {mode === "pin" && (
        <div className="flex flex-col items-center gap-6 w-full max-w-xs">
          <p className="text-gray-300 text-lg">Enter your 4-digit PIN</p>

          {/* PIN dots */}
          <div className="flex gap-4">
            {pinDisplay.map((d, i) => (
              <span key={i} className="text-4xl text-indigo-400">{d}</span>
            ))}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3 w-full">
            {["1","2","3","4","5","6","7","8","9"].map((k) => (
              <button key={k} onClick={() => pressKey(k)}
                className="py-5 bg-white/10 text-white text-2xl font-semibold rounded-xl hover:bg-white/20 active:scale-95 transition-all border border-white/10">
                {k}
              </button>
            ))}
            <button onClick={() => setMode("home")}
              className="py-5 bg-white/5 text-gray-400 text-sm rounded-xl hover:bg-white/10 transition-colors border border-white/10">
              Back
            </button>
            <button onClick={() => pressKey("0")}
              className="py-5 bg-white/10 text-white text-2xl font-semibold rounded-xl hover:bg-white/20 active:scale-95 transition-all border border-white/10">
              0
            </button>
            <button onClick={() => setPin((p) => p.slice(0, -1))}
              className="py-5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center border border-white/10">
              <Delete className="w-6 h-6" />
            </button>
          </div>

          <button onClick={handlePinSubmit} disabled={pin.length !== 4 || loading}
            className="w-full py-4 bg-indigo-600 text-white font-bold text-lg rounded-2xl disabled:opacity-40 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Check In"}
          </button>
        </div>
      )}

      {/* ── NAME SEARCH ──────────────────────────────────────── */}
      {mode === "name" && (
        <NameSearchMode
          search={search}
          setSearch={setSearch}
          onCheckin={handleNameCheckin}
          onBack={() => setMode("home")}
          loading={loading}
        />
      )}

      {/* ── SUCCESS ──────────────────────────────────────────── */}
      {mode === "success" && member && (
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-10 h-10 text-white" />
          </div>
          <div>
            <p className="text-white text-3xl font-bold">{member.name}</p>
            <p className="text-gray-400 mt-1">{member.plan}</p>
          </div>
          <div className="bg-green-500/20 border border-green-500/30 rounded-2xl px-8 py-4">
            <p className="text-green-400 text-xl font-semibold">Checked in successfully!</p>
          </div>
          <p className="text-gray-500 text-sm">Returning to home in 5 seconds...</p>
        </div>
      )}

      {/* ── ERROR ────────────────────────────────────────────── */}
      {mode === "error" && (
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center">
            <X className="w-10 h-10 text-white" />
          </div>
          <div>
            <p className="text-white text-2xl font-bold">Check-in Failed</p>
            <p className="text-red-400 mt-2">{error}</p>
          </div>
          <button onClick={() => setMode("home")} className="btn-primary">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

function NameSearchMode({
  search, setSearch, onCheckin, onBack, loading,
}: {
  search: string;
  setSearch: (v: string) => void;
  onCheckin: (id: string, name: string) => void;
  onBack: () => void;
  loading: boolean;
}) {
  const [results, setResults] = useState<{ id: string; name: string; memberNumber: string; status: string }[]>([]);
  const [searching, setSearching] = useState(false);

  async function doSearch(q: string) {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    const res = await fetch(`/api/kiosk/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data.members ?? []);
    setSearching(false);
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-md">
      <p className="text-gray-300 text-lg">Search your name</p>
      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); doSearch(e.target.value); }}
          className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white text-lg placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Type your name..."
          autoFocus
        />
      </div>

      <div className="w-full space-y-2">
        {searching && <p className="text-gray-400 text-center text-sm">Searching...</p>}
        {results.map((r) => (
          <button key={r.id} onClick={() => onCheckin(r.id, r.name)} disabled={loading}
            className="w-full flex items-center justify-between px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-left hover:bg-white/20 transition-colors">
            <div>
              <p className="text-white font-semibold">{r.name}</p>
              <p className="text-gray-400 text-sm">{r.memberNumber}</p>
            </div>
            <span className={`badge ${r.status === "ACTIVE" ? "badge-green" : "badge-red"}`}>
              {r.status}
            </span>
          </button>
        ))}
      </div>

      <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors text-sm">
        ← Back
      </button>
    </div>
  );
}
