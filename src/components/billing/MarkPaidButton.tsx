"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";

export default function MarkPaidButton({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  async function markPaid() {
    const ok = await confirm({
      title: "Mark as Paid?",
      message: "This will mark the invoice as paid via Cash and record a payment.",
      confirmLabel: "Mark Paid",
    });
    if (!ok) return;
    setLoading(true);
    await fetch(`/api/invoices/${invoiceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_paid", method: "CASH" }),
    });
    setLoading(false);
    toast.success("Invoice marked as paid.");
    router.refresh();
  }

  return (
    <button onClick={markPaid} disabled={loading}
      className="text-xs text-emerald-600 font-medium hover:text-emerald-700 disabled:opacity-50">
      {loading ? "..." : "Mark Paid"}
    </button>
  );
}
