import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { code, amount } = await req.json();
  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

  const discount = await prisma.discount.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!discount || !discount.isActive)
    return NextResponse.json({ error: "Invalid or inactive coupon code." }, { status: 404 });

  if (discount.expiresAt && discount.expiresAt < new Date())
    return NextResponse.json({ error: "This coupon has expired." }, { status: 410 });

  if (discount.usageLimit !== null && discount.usedCount >= discount.usageLimit)
    return NextResponse.json({ error: "This coupon has reached its usage limit." }, { status: 410 });

  const base = Number(amount) || 0;
  const discountAmount = discount.type === "PERCENT"
    ? Math.round(base * Number(discount.value)) / 100
    : Math.min(Number(discount.value), base);

  return NextResponse.json({
    id: discount.id,
    code: discount.code,
    name: discount.name,
    type: discount.type,
    value: Number(discount.value),
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalAmount: Math.max(0, Math.round((base - discountAmount) * 100) / 100),
  });
}
