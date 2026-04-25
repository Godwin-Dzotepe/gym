import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date(0);
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();
  to.setHours(23, 59, 59, 999);

  const [payments, newMembers, checkins] = await Promise.all([
    prisma.payment.findMany({
      where: { status: "PAID", createdAt: { gte: from, lte: to } },
      include: { invoice: { select: { invoiceNumber: true, description: true } }, member: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.member.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { firstName: true, lastName: true, email: true, createdAt: true, status: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.attendance.count({ where: { checkedInAt: { gte: from, lte: to } } }),
  ]);

  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);

  const lines: string[] = [
    `"Report Period","${from.toISOString().split("T")[0]} to ${to.toISOString().split("T")[0]}"`,
    `"Total Revenue","${totalRevenue.toFixed(2)}"`,
    `"Total Payments","${payments.length}"`,
    `"New Members","${newMembers.length}"`,
    `"Total Check-ins","${checkins}"`,
    `""`,
    `"PAYMENTS"`,
    `"Date","Member","Invoice","Description","Amount","Method"`,
    ...payments.map(p => [
      `"${p.createdAt.toISOString().split("T")[0]}"`,
      `"${p.member.firstName} ${p.member.lastName}"`,
      `"${p.invoice?.invoiceNumber ?? ""}"`,
      `"${p.invoice?.description ?? ""}"`,
      `"${Number(p.amount).toFixed(2)}"`,
      `"${p.method}"`,
    ].join(",")),
    `""`,
    `"NEW MEMBERS"`,
    `"Date","Name","Email","Status"`,
    ...newMembers.map(m => [
      `"${m.createdAt.toISOString().split("T")[0]}"`,
      `"${m.firstName} ${m.lastName}"`,
      `"${m.email}"`,
      `"${m.status}"`,
    ].join(",")),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="report-${from.toISOString().split("T")[0]}.csv"`,
    },
  });
}
