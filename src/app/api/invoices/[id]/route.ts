import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      member: { select: { firstName: true, lastName: true, email: true, phone: true, memberNumber: true } },
      memberPlan: { include: { plan: { select: { name: true, price: true, billingCycle: true } } } },
      payments: true,
    },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(invoice);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  if (body.action === "mark_paid") {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [updated] = await prisma.$transaction([
      prisma.invoice.update({
        where: { id },
        data: { status: "PAID", paidAt: new Date() },
      }),
      prisma.payment.create({
        data: {
          invoiceId: id,
          memberId: invoice.memberId,
          amount: invoice.total,
          method: body.method ?? "CASH",
          status: "PAID",
          notes: body.notes,
        },
      }),
    ]);
    await prisma.notification.create({
      data: {
        memberId: invoice.memberId,
        type: "PAYMENT_RECEIVED",
        title: "Payment Received",
        message: `Payment of ${Number(invoice.total).toFixed(2)} received for invoice ${invoice.invoiceNumber ?? id}.`,
        link: `/dashboard/billing/${id}`,
      },
    });
    return NextResponse.json(updated);
  }

  if (body.action === "void") {
    const updated = await prisma.invoice.update({ where: { id }, data: { status: "VOID" } });
    return NextResponse.json(updated);
  }

  if (body.action === "waive") {
    const updated = await prisma.invoice.update({ where: { id }, data: { status: "WAIVED", paidAt: new Date() } });
    return NextResponse.json(updated);
  }

  const updated = await prisma.invoice.update({ where: { id }, data: body });
  return NextResponse.json(updated);
}
