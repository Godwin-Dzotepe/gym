"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";

interface Props { classId: string; memberId: string; isBooked: boolean; isFull: boolean; }

export default function PortalClassBooking({ classId, memberId, isBooked, isFull }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/classes/book", {
        method: isBooked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, memberId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (isFull && !isBooked) {
    return <button disabled className="btn-secondary w-full justify-center text-sm opacity-50">Class Full</button>;
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
        </p>
      )}
      <button onClick={toggle} disabled={loading}
        className={`w-full justify-center text-sm ${isBooked ? "btn-secondary" : "btn-primary"}`}>
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
        {isBooked ? "Cancel Booking" : "Book Class"}
      </button>
    </div>
  );
}
