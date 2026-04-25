import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") ?? "ACTIVE";
  const items = await prisma.recurringPayment.findMany({
    where: { status: status as any },
    include: { member: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    items: items.map(r => ({
      id: r.id,
      memberName: `${r.member.firstName} ${r.member.lastName}`,
      amount: Number(r.amount),
      description: r.description,
      billingCycle: r.billingCycle,
      frequency: r.frequency,
      firstPayment: r.firstPayment.toISOString(),
      nextPayment: r.nextPayment?.toISOString() ?? null,
      status: r.status,
      paymentMethod: r.paymentMethod,
    })),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item = await prisma.recurringPayment.create({
    data: {
      memberId: body.memberId,
      amount: parseFloat(body.amount),
      discount: parseFloat(body.discount || "0"),
      description: body.description || null,
      paymentMethod: body.paymentMethod as any,
      frequency: parseInt(body.frequency),
      billingCycle: body.billingCycle as any,
      scheduledDay: parseInt(body.scheduledDay),
      firstPayment: new Date(body.firstPayment),
      nextPayment: new Date(body.firstPayment),
      status: "ACTIVE",
    },
  });
  return NextResponse.json({ item }, { status: 201 });
}
