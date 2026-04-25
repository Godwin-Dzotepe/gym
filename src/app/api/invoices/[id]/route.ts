import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function advanceBillingDate(from: Date, billingCycle: string): Date {
  const d = new Date(from);
  if (billingCycle === "DAILY")        d.setDate(d.getDate() + 1);
  else if (billingCycle === "WEEKLY")  d.setDate(d.getDate() + 7);
  else if (billingCycle === "MONTHLY") d.setMonth(d.getMonth() + 1);
  else if (billingCycle === "YEARLY")  d.setFullYear(d.getFullYear() + 1);
  return d;
}

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
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { memberPlan: { include: { plan: true } } },
    });
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
          method: (body.method ?? "CASH") as any,
          status: "PAID",
          notes: body.notes,
        },
      }),
    ]);

    // Reactivate member if they were suspended/frozen due to non-payment
    const member = await prisma.member.findUnique({ where: { id: invoice.memberId } });
    if (member?.status === "FROZEN" || member?.status === "PENDING") {
      await prisma.member.update({
        where: { id: invoice.memberId },
        data: { status: "ACTIVE" },
      });
    }

    // Advance nextBillingDate on ONGOING plans after payment
    if (invoice.memberPlan && invoice.memberPlan.plan.durationType === "ONGOING") {
      const plan = invoice.memberPlan.plan;
      const current = invoice.memberPlan.nextBillingDate ?? new Date();
      const next = advanceBillingDate(current, plan.billingCycle);
      await prisma.memberPlan.update({
        where: { id: invoice.memberPlan.id },
        data: { nextBillingDate: next },
      });
    }

    await prisma.notification.create({
      data: {
        memberId: invoice.memberId,
        type: "PAYMENT_RECEIVED",
        title: "Payment Received",
        message: `Payment of ${Number(invoice.total).toFixed(2)} received for invoice ${invoice.invoiceNumber}.`,
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
