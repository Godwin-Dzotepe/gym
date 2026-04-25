import { prisma } from "@/lib/prisma";
import { getGymCurrency } from "@/lib/currency";
import { notFound } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PrintButton from "@/components/billing/PrintButton";

interface Props { params: Promise<{ id: string }> }

export default async function POSSaleReceiptPage({ params }: Props) {
  const { id } = await params;

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      member: { select: { firstName: true, lastName: true, email: true, phone: true, memberNumber: true } },
      staff:  { select: { firstName: true, lastName: true } },
      items:  { include: { product: { select: { name: true } } } },
    },
  });

  if (!sale) notFound();

  const [settings, currency] = await Promise.all([
    prisma.gymSettings.findFirst().catch(() => null),
    getGymCurrency(),
  ]);

  const gymName    = settings?.gymName    ?? "The Oracle Gym";
  const gymEmail   = settings?.email      ?? "";
  const gymPhone   = settings?.phone      ?? "";
  const gymAddress = settings?.address    ?? "";

  const subtotal = Number(sale.subtotal);
  const tax      = Number(sale.tax);
  const discount = Number(sale.discount);
  const total    = Number(sale.total);

  const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
    PAID:    { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    PENDING: { bg: "bg-yellow-50",  text: "text-yellow-700",  dot: "bg-yellow-500"  },
    FAILED:  { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500"     },
  };
  const ss = STATUS_STYLES[sale.status] ?? STATUS_STYLES.PAID;

  return (
    <div className="space-y-5 max-w-3xl">
        {/* Nav */}
        <div className="flex items-center justify-between no-print">
          <Link href="/dashboard/pos" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-3.5 h-3.5" /> All Sales
          </Link>
          <PrintButton />
        </div>

        {/* Receipt */}
        <div id="receipt" className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-100 print:rounded-none print:shadow-none print:border-0">

          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/gym-logo.png" alt="" className="w-80 h-80 object-contain opacity-[0.07] blur-[2px]" />
          </div>

          <div className="relative z-10">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-5 sm:px-8 py-5 sm:py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/gym-logo.png" alt="Logo" className="w-12 h-12 sm:w-14 sm:h-14 object-contain rounded-full border-2 border-orange-400/60 flex-shrink-0" />
                <div>
                  <h1 className="text-lg sm:text-xl font-black text-white tracking-wide">{gymName}</h1>
                  {gymAddress && <p className="text-xs text-gray-400 mt-0.5">{gymAddress}</p>}
                  <div className="flex flex-wrap gap-2 sm:gap-3 mt-1">
                    {gymEmail && <span className="text-xs text-gray-400">{gymEmail}</span>}
                    {gymPhone && <span className="text-xs text-gray-400">{gymPhone}</span>}
                  </div>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Sale Receipt</p>
                <p className="text-base sm:text-lg font-bold text-orange-400 font-mono">{sale.saleNumber.slice(-8).toUpperCase()}</p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mt-2 ${ss.bg} ${ss.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} />
                  {sale.status.charAt(0) + sale.status.slice(1).toLowerCase()}
                </span>
              </div>
            </div>

            {/* Orange bar */}
            <div className="h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500" />

            {/* Body */}
            <div className="px-5 sm:px-8 py-6 sm:py-7 space-y-6 sm:space-y-7">

              {/* Customer + Sale Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Customer</p>
                  {sale.member ? (
                    <>
                      <p className="text-base font-bold text-gray-900">{sale.member.firstName} {sale.member.lastName}</p>
                      {sale.member.email && <p className="text-sm text-gray-500 mt-0.5">{sale.member.email}</p>}
                      {sale.member.phone && <p className="text-sm text-gray-500">{sale.member.phone}</p>}
                      <p className="text-xs text-gray-400 font-mono mt-1">{sale.member.memberNumber}</p>
                    </>
                  ) : (
                    <p className="text-base font-bold text-gray-500 italic">Walk-in Customer</p>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Sale Info</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-400">Date</span>
                      <span className="text-gray-700">{formatDate(sale.createdAt)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-400">Method</span>
                      <span className="text-gray-700 capitalize">{sale.method.toLowerCase().replace(/_/g, " ")}</span>
                    </div>
                    {sale.transactionId && (
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-400">Transaction ID</span>
                        <span className="text-gray-700 font-mono text-xs">{sale.transactionId}</span>
                      </div>
                    )}
                    {sale.staff && (
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-400">Served by</span>
                        <span className="text-gray-700">{sale.staff.firstName} {sale.staff.lastName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Line items */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-900 text-white">
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider rounded-tl-lg">Item</th>
                      <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Qty</th>
                      <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Unit Price</th>
                      <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider rounded-tr-lg">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="px-3 sm:px-4 py-3 sm:py-4 font-medium text-gray-900">{item.product.name}</td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-right text-gray-600">{item.quantity}</td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-right text-gray-600">{formatCurrency(Number(item.unitPrice), currency)}</td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-right font-medium text-gray-900">{formatCurrency(Number(item.total), currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-full sm:w-64 space-y-2">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span><span>{formatCurrency(subtotal, currency)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Discount</span><span>- {formatCurrency(discount, currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Tax</span><span>{formatCurrency(tax, currency)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-gray-900 border-t-2 border-gray-900 pt-2 mt-2">
                    <span>Total</span><span>{formatCurrency(total, currency)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {sale.notes && (
                <div className="bg-gray-50 rounded-xl px-4 sm:px-5 py-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Notes</p>
                  <p className="text-sm text-gray-600">{sale.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-900 px-5 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
              <p className="text-xs text-gray-500">Thank you for your purchase at {gymName}.</p>
              <p className="text-xs text-orange-400 font-mono">{sale.saleNumber.slice(-8).toUpperCase()}</p>
            </div>
          </div>
        </div>
      </div>
  );
}
