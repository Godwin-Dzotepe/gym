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
  const { memberId, planId, startDate, endDate: customEndDate, paymentMethod, discount: manualDiscount } = await req.json();
  if (!memberId || !planId) return NextResponse.json({ error: "memberId and planId required" }, { status: 400 });

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  // Auto-apply family discount if plan is family-shared
  let discount = Number(manualDiscount ?? 0);
  if (plan.isFamilyShared) {
    const familyMembership = await prisma.familyMember.findFirst({
      where: { memberId },
      include: {
        family: {
          include: {
            members: {
              where: { isPrimary: false },
              include: { member: { include: { memberPlans: { where: { planId, isActive: true }, take: 1 } } } },
            },
          },
        },
      },
    });
    if (familyMembership && !familyMembership.isPrimary) {
      // Count how many other non-primary family members already have this plan active
      const membersWithPlan = familyMembership.family.members.filter(
        fm => fm.memberId !== memberId && fm.member.memberPlans.length > 0
      ).length;
      // position: 1 = first non-primary (2nd family member), 2 = third, etc.
      const position = membersWithPlan + 1;
      const pct =
        position === 1 ? Number(plan.familyDiscount2nd) :
        position === 2 ? Number(plan.familyDiscount3rd) :
                         Number(plan.familyDiscount4th);
      if (pct > 0) {
        discount = Math.round((Number(plan.price) * pct) / 100 * 100) / 100;
      }
    }
  }

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
    const discountAmt = discount;
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

  // Reactivate member if PENDING or FROZEN
  await prisma.member.updateMany({
    where: { id: memberId, status: { in: ["PENDING", "FROZEN"] } },
    data: { status: "ACTIVE" },
  });

  return NextResponse.json({ memberPlan }, { status: 201 });
}
