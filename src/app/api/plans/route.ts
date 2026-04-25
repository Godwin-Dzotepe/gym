import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { memberPlans: true } } },
    });
    return NextResponse.json(plans);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, price } = body;
    const hasAnyPrice = price || body.dailyPrice || body.weeklyPrice || body.monthlyPrice || body.yearlyPrice;
    if (!name || !hasAnyPrice) return NextResponse.json({ error: "name and at least one price required" }, { status: 400 });

    // Use monthlyPrice as primary price if set, else first provided price
    const primaryPrice = Number(body.monthlyPrice ?? body.weeklyPrice ?? body.yearlyPrice ?? body.dailyPrice ?? price ?? 0);

    const plan = await prisma.plan.create({
      data: {
        name,
        description: body.description || null,
        planType: body.planType ?? "RECURRING",
        price: primaryPrice,
        dailyPrice:   body.dailyPrice   ? Number(body.dailyPrice)   : null,
        weeklyPrice:  body.weeklyPrice  ? Number(body.weeklyPrice)  : null,
        monthlyPrice: body.monthlyPrice ? Number(body.monthlyPrice) : null,
        yearlyPrice:  body.yearlyPrice  ? Number(body.yearlyPrice)  : null,
        billingCycle: body.billingCycle ?? "MONTHLY",
        maxPayments: body.maxPayments ? Number(body.maxPayments) : null,
        durationType: body.durationType ?? "ONGOING",
        duration: Number(body.duration ?? 1),
        signUpFee: body.signUpFee ? Number(body.signUpFee) : 0,
        lateFee: body.lateFee ? Number(body.lateFee) : 0,
        lateFeeAfterDays: body.lateFeeAfterDays ? Number(body.lateFeeAfterDays) : 5,
        accessLimit: body.accessLimit ? Number(body.accessLimit) : null,
        capacity: body.capacity ? Number(body.capacity) : null,
        startOnFirstCheckin: body.startOnFirstCheckin === true,
        isFamilyShared: body.isFamilyShared === true,
        familyDiscount2nd: body.familyDiscount2nd ? Number(body.familyDiscount2nd) : 0,
        familyDiscount3rd: body.familyDiscount3rd ? Number(body.familyDiscount3rd) : 0,
        familyDiscount4th: body.familyDiscount4th ? Number(body.familyDiscount4th) : 0,
        maxMembers: body.maxMembers ? Number(body.maxMembers) : null,
        features: body.features || null,
        isActive: body.isActive !== false,
        allowFreezing: body.allowFreezing !== false,
        trialCancelAtEnd: body.trialCancelAtEnd !== false,
        cancellationFee: body.cancellationFee ? Number(body.cancellationFee) : 0,
      },
    });
    return NextResponse.json(plan, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/plans error:", e);
    return NextResponse.json({ error: e.message ?? "Failed to create plan" }, { status: 500 });
  }
}
