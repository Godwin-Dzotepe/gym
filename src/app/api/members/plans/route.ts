import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNumber } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const { memberId, planId, startDate, endDate: customEndDate, paymentMethod, discount = 0 } = await req.json();
  if (!memberId || !planId) return NextResponse.json({ error: "memberId and planId required" }, { status: 400 });

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  // Calculate end date for limited duration plans
  let endDate: Date | null = customEndDate ? new Date(customEndDate) : null;
  if (!endDate && plan.durationType === "LIMITED") {
    endDate = new Date(startDate);
    if (plan.billingCycle === "DAILY") endDate.setDate(endDate.getDate() + plan.duration);
    else if (plan.billingCycle === "WEEKLY") endDate.setDate(endDate.getDate() + plan.duration * 7);
    else if (plan.billingCycle === "MONTHLY") endDate.setMonth(endDate.getMonth() + plan.duration);
    else if (plan.billingCycle === "YEARLY") endDate.setFullYear(endDate.getFullYear() + plan.duration);
  }

  const memberPlan = await prisma.memberPlan.create({
    data: {
      memberId,
      planId,
      startDate: new Date(startDate),
      endDate,
      paymentMethod: paymentMethod as any ?? "MANUAL",
      isActive: true,
    },
  });

  // Create initial invoice if plan has a price
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
        paymentMethod: paymentMethod as any ?? "MANUAL",
        dueDate: new Date(startDate),
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
