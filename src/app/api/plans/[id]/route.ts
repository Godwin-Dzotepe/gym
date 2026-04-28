import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(plan);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const primaryPrice = Number(
    body.monthlyPrice || body.weeklyPrice || body.yearlyPrice || body.dailyPrice || body.price || 0
  );

  try {
    const plan = await prisma.plan.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description || null,
        planType: body.planType,
        price: primaryPrice,
        dailyPrice:   body.dailyPrice   ? Number(body.dailyPrice)   : null,
        weeklyPrice:  body.weeklyPrice  ? Number(body.weeklyPrice)  : null,
        monthlyPrice: body.monthlyPrice ? Number(body.monthlyPrice) : null,
        yearlyPrice:  body.yearlyPrice  ? Number(body.yearlyPrice)  : null,
        billingCycle: body.billingCycle ?? "MONTHLY",
        maxPayments:  body.maxPayments  ? Number(body.maxPayments)  : null,
        durationType: body.durationType,
        duration:     body.duration     ? Number(body.duration)     : 1,
        signUpFee:    body.signUpFee    ? Number(body.signUpFee)    : 0,
        lateFee:      body.lateFee      ? Number(body.lateFee)      : 0,
        lateFeeAfterDays: body.lateFeeAfterDays ? Number(body.lateFeeAfterDays) : 5,
        accessLimit:  body.accessLimit  ? Number(body.accessLimit)  : null,
        capacity:     body.capacity     ? Number(body.capacity)     : null,
        maxMembers:   body.maxMembers   ? Number(body.maxMembers)   : null,
        startOnFirstCheckin: body.startOnFirstCheckin === true,
        isFamilyShared:      body.isFamilyShared === true,
        familyDiscount2nd: body.familyDiscount2nd ? Number(body.familyDiscount2nd) : 0,
        familyDiscount3rd: body.familyDiscount3rd ? Number(body.familyDiscount3rd) : 0,
        familyDiscount4th: body.familyDiscount4th ? Number(body.familyDiscount4th) : 0,
        features:       body.features       || null,
        isActive:       body.isActive !== false,
        allowFreezing:  body.allowFreezing !== false,
        trialCancelAtEnd: body.trialCancelAtEnd !== false,
        cancellationFee: body.cancellationFee ? Number(body.cancellationFee) : 0,
      },
    });
    return NextResponse.json(plan);
  } catch (err: any) {
    console.error("Plan update error:", err);
    return NextResponse.json({ error: err.message ?? "Failed to update plan" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.plan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
