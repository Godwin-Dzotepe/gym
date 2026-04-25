import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNumber } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const memberId = req.nextUrl.searchParams.get("memberId");

  const where: any = {};
  if (status) where.status = status;
  if (memberId) where.memberId = memberId;

  const invoices = await prisma.invoice.findMany({
    where,
    include: { member: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    invoices: invoices.map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      memberName: `${inv.member.firstName} ${inv.member.lastName}`,
      memberId: inv.memberId,
      description: inv.description,
      amount: Number(inv.amount),
      discount: Number(inv.discount),
      tax: Number(inv.tax),
      total: Number(inv.total),
      status: inv.status,
      paymentMethod: inv.paymentMethod,
      transactionId: inv.transactionId,
      dueDate: inv.dueDate.toISOString(),
      paidAt: inv.paidAt?.toISOString() ?? null,
      createdAt: inv.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { memberId, memberPlanId, description, amount, discount = 0, tax = 0,
    dueDate, paymentMethod = "CASH", transactionId, sendEmail = false, notes } = body;

  if (!memberId || !amount || !dueDate)
    return NextResponse.json({ error: "memberId, amount, dueDate required" }, { status: 400 });

  const total = Number(amount) - Number(discount) + Number(tax);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: generateInvoiceNumber(),
      memberId,
      memberPlanId: memberPlanId || null,
      description: description || null,
      amount: Number(amount),
      discount: Number(discount),
      tax: Number(tax),
      total,
      dueDate: new Date(dueDate),
      paymentMethod: paymentMethod as any,
      transactionId: transactionId || null,
      sendEmail,
      notes,
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
