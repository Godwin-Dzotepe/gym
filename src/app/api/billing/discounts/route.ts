import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const discounts = await prisma.discount.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ discounts: discounts.map(d => ({ ...d, value: Number(d.value) })) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const d = await prisma.discount.create({
    data: {
      code: body.code,
      name: body.name || null,
      type: body.type,
      value: parseFloat(body.value),
      usageLimit: body.usageLimit ? parseInt(body.usageLimit) : null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
  });
  return NextResponse.json({ discount: d }, { status: 201 });
}
