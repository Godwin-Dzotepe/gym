import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getGymCurrency } from "@/lib/currency";
import { CreditCard, CheckCircle2, AlertCircle, Clock } from "lucide-react";

export default async function PortalPaymentsPage() {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId;

  const invoices = await prisma.invoice.findMany({
    where: { memberId },
    orderBy: { createdAt: "desc" },
    include: { payments: true, memberPlan: { include: { plan: { select: { name: true } } } } },
  });

  const [totalPaid, totalDue, currency] = [
    invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + Number(i.total), 0),
    invoices.filter((i) => i.status !== "PAID").reduce((s, i) => s + Number(i.total), 0),
    await getGymCurrency(),
  ];

  const statusIcon = (s: string) => s === "PAID" ? CheckCircle2 : s === "FAILED" ? AlertCircle : Clock;
  const statusBadge: Record<string, string> = {
    PAID: "badge-green", PENDING: "badge-yellow", FAILED: "badge-red",
  };

  return (
    <div className="space-y-5">
      <h1 className="page-title">Payments & Invoices</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 text-center">
          <p className="stat-label">Total Paid</p>
          <p className="stat-value text-emerald-600 mt-1">{formatCurrency(totalPaid, currency)}</p>
        </div>
        <div className="card p-5 text-center">
          <p className="stat-label">Outstanding</p>
          <p className={`stat-value mt-1 ${totalDue > 0 ? "text-red-500" : "text-slate-400"}`}>
            {formatCurrency(totalDue, currency)}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="section-title">Invoice History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th hidden sm:table-cell">Invoice</th>
                <th className="table-th hidden sm:table-cell">Plan</th>
                <th className="table-th">Amount</th>
                <th className="table-th hidden sm:table-cell">Due</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr><td colSpan={5} className="table-td text-center text-slate-400 py-10">No invoices yet</td></tr>
              ) : invoices.map((inv) => {
                const Icon = statusIcon(inv.status);
                return (
                  <tr key={inv.id}>
                    <td className="table-td font-mono text-xs text-slate-400 hidden sm:table-cell">{inv.invoiceNumber}</td>
                    <td className="table-td text-slate-600 hidden sm:table-cell">{inv.memberPlan?.plan.name ?? "One-time"}</td>
                    <td className="table-td font-semibold">{formatCurrency(Number(inv.total), currency)}</td>
                    <td className="table-td text-slate-500 text-xs hidden sm:table-cell">{formatDate(inv.dueDate)}</td>
                    <td className="table-td">
                      <span className={`badge ${statusBadge[inv.status] ?? "badge-gray"}`}>
                        {inv.status.charAt(0) + inv.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
