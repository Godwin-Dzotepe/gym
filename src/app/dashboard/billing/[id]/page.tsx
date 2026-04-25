import { prisma } from "@/lib/prisma";
import { getGymCurrency } from "@/lib/currency";
import { notFound } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MarkPaidButton from "@/components/billing/MarkPaidButton";
import PrintButton from "@/components/billing/PrintButton";

interface Props { params: Promise<{ id: string }> }

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      member: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, memberNumber: true } },
      memberPlan: { include: { plan: { select: { name: true, price: true, billingCycle: true } } } },
      payments: true,
    },
  });

  if (!invoice) notFound();

  const [settings, currency] = await Promise.all([
    prisma.gymSettings.findFirst().catch(() => null),
    getGymCurrency(),
  ]);

  const gymName  = settings?.gymName  ?? "The Oracle Gym";
  const gymEmail = settings?.email    ?? "";
  const gymPhone = settings?.phone    ?? "";
  const gymAddress = settings?.address ?? "";

  const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
    PAID:     { bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
    PENDING:  { bg: "bg-yellow-50",   text: "text-yellow-700",  dot: "bg-yellow-500"  },
    FAILED:   { bg: "bg-red-50",      text: "text-red-700",     dot: "bg-red-500"     },
    REFUNDED: { bg: "bg-blue-50",     text: "text-blue-700",    dot: "bg-blue-500"    },
    WAIVED:   { bg: "bg-gray-100",    text: "text-gray-600",    dot: "bg-gray-400"    },
  };
  const ss = STATUS_STYLES[invoice.status] ?? STATUS_STYLES.PENDING;

  const subtotal = Number(invoice.amount);
  const tax      = Number(invoice.tax);
  const total    = Number(invoice.total);

  return (
    <div className="space-y-5 max-w-3xl">
        {/* Top nav — hidden on print */}
        <div className="flex items-center justify-between no-print">
          <Link href="/dashboard/billing" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-3.5 h-3.5" /> All Invoices
          </Link>
          <div className="flex gap-2">
            {invoice.status === "PENDING" && <MarkPaidButton invoiceId={invoice.id} />}
            <PrintButton />
          </div>
        </div>

        {/* ── RECEIPT ── */}
        <div id="receipt" className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-100 print:rounded-none print:shadow-none print:border-0">

          {/* Watermark logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/gym-logo.png" alt="" className="w-80 h-80 object-contain opacity-[0.07] blur-[2px]" />
          </div>

          {/* Content */}
          <div className="relative z-10">

            {/* Header stripe */}
            <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/gym-logo.png" alt="Logo" className="w-14 h-14 object-contain rounded-full border-2 border-orange-400/60" />
                <div>
                  <h1 className="text-xl font-black text-white tracking-wide">{gymName}</h1>
                  {gymAddress && <p className="text-xs text-gray-400 mt-0.5">{gymAddress}</p>}
                  <div className="flex gap-3 mt-1">
                    {gymEmail && <span className="text-xs text-gray-400">{gymEmail}</span>}
                    {gymPhone && <span className="text-xs text-gray-400">{gymPhone}</span>}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Receipt</p>
                <p className="text-lg font-bold text-orange-400 font-mono">{invoice.invoiceNumber}</p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mt-2 ${ss.bg} ${ss.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} />
                  {invoice.status.charAt(0) + invoice.status.slice(1).toLowerCase()}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500" />

            {/* Body */}
            <div className="px-8 py-7 space-y-7">

              {/* Member + Plan */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Billed To</p>
                  <Link href={`/dashboard/members/${invoice.member.id}`}
                    className="text-base font-bold text-gray-900 hover:text-orange-600 transition-colors no-print">
                    {invoice.member.firstName} {invoice.member.lastName}
                  </Link>
                  <p className="text-base font-bold text-gray-900 hidden print:block">
                    {invoice.member.firstName} {invoice.member.lastName}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">{invoice.member.email}</p>
                  {invoice.member.phone && <p className="text-sm text-gray-500">{invoice.member.phone}</p>}
                  <p className="text-xs text-gray-400 font-mono mt-1">{invoice.member.memberNumber}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Invoice Info</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-400">Invoice #</span>
                      <span className="font-mono font-medium text-gray-700">{invoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-400">Issue Date</span>
                      <span className="text-gray-700">{formatDate(invoice.createdAt)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-400">Due Date</span>
                      <span className="text-gray-700">{formatDate(invoice.dueDate)}</span>
                    </div>
                    {invoice.paidAt && (
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-400">Paid At</span>
                        <span className="text-emerald-600 font-medium">{formatDate(invoice.paidAt)}</span>
                      </div>
                    )}
                    {invoice.paymentMethod && (
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-400">Method</span>
                        <span className="text-gray-700 capitalize">{invoice.paymentMethod.toLowerCase().replace("_", " ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Line items table */}
              <div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-900 text-white">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider rounded-tl-lg">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Unit Price</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider rounded-tr-lg">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900">
                          {invoice.memberPlan?.plan.name
                            ? `${invoice.memberPlan.plan.name} Membership`
                            : invoice.description ?? "Gym Charge"}
                        </p>
                        {invoice.memberPlan && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatCurrency(Number(invoice.memberPlan.plan.price), currency)} / {invoice.memberPlan.plan.billingCycle.toLowerCase()}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-600">1</td>
                      <td className="px-4 py-4 text-right text-gray-600">{formatCurrency(subtotal, currency)}</td>
                      <td className="px-4 py-4 text-right font-medium text-gray-900">{formatCurrency(subtotal, currency)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Totals */}
                <div className="mt-4 flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Subtotal</span><span>{formatCurrency(subtotal, currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Tax</span><span>{formatCurrency(tax, currency)}</span>
                    </div>
                    {Number(invoice.discount) > 0 && (
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span>Discount</span><span>- {formatCurrency(Number(invoice.discount), currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold text-gray-900 border-t-2 border-gray-900 pt-2 mt-2">
                      <span>Total</span><span>{formatCurrency(total, currency)}</span>
                    </div>
                    {invoice.status === "PAID" && (
                      <div className="flex justify-between text-sm font-semibold text-emerald-600">
                        <span>Amount Paid</span><span>{formatCurrency(total, currency)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="bg-gray-50 rounded-xl px-5 py-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Notes</p>
                  <p className="text-sm text-gray-600">{invoice.notes}</p>
                </div>
              )}

              {/* Payment Records */}
              {invoice.payments.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Payment Records</p>
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                    {invoice.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between px-4 py-3 bg-white">
                        <div>
                          <p className="text-sm font-medium text-gray-800 capitalize">{p.method.replace("_", " ").toLowerCase()}</p>
                          <p className="text-xs text-gray-400">{formatDate(p.createdAt)}</p>
                        </div>
                        <p className="font-semibold text-emerald-600">{formatCurrency(Number(p.amount), currency)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-900 px-8 py-4 flex items-center justify-between">
              <p className="text-xs text-gray-500">Thank you for being a valued member of {gymName}.</p>
              <p className="text-xs text-orange-400 font-mono">{invoice.invoiceNumber}</p>
            </div>
          </div>
        </div>
      </div>
  );
}
