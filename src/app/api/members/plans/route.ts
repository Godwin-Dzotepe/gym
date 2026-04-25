import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNumber } from "@/lib/utils";

function calcNextBillingDate(from: Date, billingCycle: string): Date {
  const d = new Date(from);
  if (billingCycle === "DAILY")   d.setDate(d.getDate() + 1);
  else if (billingCycle === "WEEKLY")  d.setDate(d.getDate() + 7);
  else if (billingCycle === "MONTHLY") d.setMonth(d.getMonth() + 1);
  else if (billingCycle === "YEARLY")  d.setFullYear(d.getFullYear() + 1);
  return d;
}

export async function POST(req: NextRequest) {
  const { memberId, planId, startDate, endDate: customEndDate, paymentMethod, discount = 0 } = await req.json();
  if (!memberId || !planId) return NextResponse.json({ error: "memberId and planId required" }, { status: 400 });

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const start = startDate ? new Date(startDate) : new Date();

  // Calculate end date for LIMITED plans
  let endDate: Date | null = customEndDate ? new Date(customEndDate) : null;
  if (!endDate && plan.durationType === "LIMITED") {
    endDate = new Date(start);
    if (plan.billingCycle === "DAILY")        endDate.setDate(endDate.getDate() + plan.duration);
    else if (plan.billingCycle === "WEEKLY")  endDate.setDate(endDate.getDate() + plan.duration * 7);
    else if (plan.billingCycle === "MONTHLY") endDate.setMonth(endDate.getMonth() + plan.duration);
    else if (plan.billingCycle === "YEARLY")  endDate.setFullYear(endDate.getFullYear() + plan.duration);
  }

  // nextBillingDate: for ONGOING = start + 1 cycle; for LIMITED = endDate; for SPECIFIC_DATES = endDate
  const nextBillingDate = plan.durationType === "ONGOING"
    ? calcNextBillingDate(start, plan.billingCycle)
    : endDate;

  const memberPlan = await prisma.memberPlan.create({
    data: {
      memberId, planId,
      startDate: start,
      endDate,
      nextBillingDate,
      paymentMethod: (paymentMethod ?? "MANUAL") as any,
      isActive: true,
    },
  });

  // Create initial invoice
  if (Number(plan.price) > 0) {
    const discountAmt = Number(discount ?? 0);
    const total = Math.max(0, Number(plan.price) - discountAmt);
    await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        memberId,
        memberPlanId: memberPlan.id,
        description: plan.name,
        amount: Number(plan.price),
        discount: discountAmt,
        tax: 0,
        total,
        paymentMethod: (paymentMethod ?? "MANUAL") as any,
        dueDate: start,
        status: "PENDING",
      },
    });
  }

  // Activate member if pending
  await prisma.member.update({
    where: { id: memberId },
    data: { status: "ACTIVE" },
  });

  return NextResponse.json({ memberPlan }, { status: 201 });
}
