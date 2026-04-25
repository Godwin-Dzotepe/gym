import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const r = await prisma.referral.update({
    where: { id },
    data: {
      converted: body.converted,
      rewardGiven: body.rewardGiven,
      convertedAt: body.converted ? new Date() : null,
    },
  });
  return NextResponse.json(r);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.referral.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
