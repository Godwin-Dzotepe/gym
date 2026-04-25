"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MarkAllReadButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function markAll() {
    setLoading(true);
    await fetch("/api/notifications/read-all", { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={markAll} disabled={loading} className="btn-secondary text-sm disabled:opacity-50">
      {loading ? "Marking..." : "Mark all as read"}
    </button>
  );
}
