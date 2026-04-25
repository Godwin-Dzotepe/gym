import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [paidStats, pendingStats, overdueInvoices, recentInvoices] = await Promise.all([
    prisma.invoice.aggregate({ where: { status: "PAID" }, _sum: { total: true } }),
    prisma.invoice.aggregate({ where: { status: "PENDING" }, _sum: { total: true } }),
    prisma.invoice.aggregate({
      where: { status: "PENDING", dueDate: { lt: new Date() } },
      _sum: { total: true },
    }),
    prisma.invoice.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { member: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  const paid = Number(paidStats._sum.total ?? 0);
  const scheduled = Number(pendingStats._sum.total ?? 0);
  const overdue = Number(overdueInvoices._sum.total ?? 0);

  return NextResponse.json({
    totalRevenue: paid,
    paid,
    scheduled,
    overdue,
    recentPayments: recentInvoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      memberName: `${inv.member.firstName} ${inv.member.lastName}`,
      amount: Number(inv.total),
      paidAt: inv.paidAt?.toISOString() ?? null,
      status: inv.status,
      paymentMethod: inv.paymentMethod,
    })),
  });
}
