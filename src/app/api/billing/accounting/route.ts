import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30");
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [paid, refunded, taxes] = await Promise.all([
    prisma.invoice.aggregate({ where: { status: "PAID", paidAt: { gte: since } }, _sum: { total: true, tax: true } }),
    prisma.invoice.aggregate({ where: { status: "REFUNDED", updatedAt: { gte: since } }, _sum: { total: true } }),
    prisma.invoice.aggregate({ where: { status: "PAID", paidAt: { gte: since } }, _sum: { tax: true } }),
  ]);

  const totalRevenue = Number(paid._sum.total ?? 0);
  const taxesAndFees = Number(taxes._sum.tax ?? 0);
  const baseAmount = totalRevenue - taxesAndFees;
  const refunds = Number(refunded._sum.total ?? 0);

  // Monthly breakdown for last 12 months
  const invoices = await prisma.invoice.findMany({
    where: { status: "PAID", paidAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } },
    select: { total: true, paidAt: true },
  });

  const monthMap = new Map<string, number>();
  invoices.forEach(inv => {
    if (!inv.paidAt) return;
    const key = inv.paidAt.toLocaleString("default", { month: "short", year: "2-digit" });
    monthMap.set(key, (monthMap.get(key) ?? 0) + Number(inv.total));
  });

  const monthly = Array.from(monthMap.entries())
    .map(([month, revenue]) => ({ month, revenue }))
    .slice(-12);

  return NextResponse.json({ totalRevenue, baseAmount, taxesAndFees, refunds, monthly });
}
