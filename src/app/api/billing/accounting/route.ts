import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  // Support both legacy ?days=N and new ?start=&end= params
  let start: Date;
  let end: Date = new Date();

  const startParam = searchParams.get("start");
  const endParam   = searchParams.get("end");
  const daysParam  = searchParams.get("days");

  if (startParam) {
    start = new Date(startParam);
  } else if (daysParam) {
    start = new Date();
    start.setDate(start.getDate() - parseInt(daysParam));
  } else {
    start = new Date();
    start.setDate(start.getDate() - 30);
  }

  if (endParam) {
    end = new Date(endParam);
  }

  // Always cover the full end day
  end.setHours(23, 59, 59, 999);

  const [paid, refunded, taxes] = await Promise.all([
    prisma.invoice.aggregate({
      where: { status: "PAID", paidAt: { gte: start, lte: end } },
      _sum: { total: true, tax: true },
    }),
    prisma.invoice.aggregate({
      where: { status: "REFUNDED", updatedAt: { gte: start, lte: end } },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: { status: "PAID", paidAt: { gte: start, lte: end } },
      _sum: { tax: true },
    }),
  ]);

  const totalRevenue = Number(paid._sum.total ?? 0);
  const taxesAndFees = Number(taxes._sum.tax ?? 0);
  const baseAmount   = totalRevenue - taxesAndFees;
  const refunds      = Number(refunded._sum.total ?? 0);

  // Chart grouping: ≤ 31 days → daily, else → monthly
  const diffDays = (end.getTime() - start.getTime()) / 86_400_000;
  const invoices = await prisma.invoice.findMany({
    where: { status: "PAID", paidAt: { gte: start, lte: end } },
    select: { total: true, paidAt: true },
  });

  let chart: { label: string; revenue: number }[];

  if (diffDays <= 31) {
    // Daily grouping — fill every day in range
    const dayMap = new Map<string, number>();
    for (const inv of invoices) {
      if (!inv.paidAt) continue;
      const key = inv.paidAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      dayMap.set(key, (dayMap.get(key) ?? 0) + Number(inv.total));
    }
    chart = [];
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    const endDay = new Date(end);
    endDay.setHours(0, 0, 0, 0);
    while (cursor <= endDay) {
      const label = cursor.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      chart.push({ label, revenue: dayMap.get(label) ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
  } else {
    // Monthly grouping — ordered map
    const monthKeys: string[] = [];
    const monthMap = new Map<string, number>();
    for (const inv of invoices) {
      if (!inv.paidAt) continue;
      const key = inv.paidAt.toLocaleString("default", { month: "short", year: "2-digit" });
      if (!monthMap.has(key)) monthKeys.push(key);
      monthMap.set(key, (monthMap.get(key) ?? 0) + Number(inv.total));
    }
    chart = monthKeys.map(k => ({ label: k, revenue: monthMap.get(k)! }));
  }

  // Keep legacy `monthly` key for backward compat
  return NextResponse.json({ totalRevenue, baseAmount, taxesAndFees, refunds, chart, monthly: chart });
}
