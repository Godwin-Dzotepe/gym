import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { classId, memberId } = await req.json();
  const sessionMemberId = (session.user as any)?.memberId;

  if (!classId || !memberId || memberId !== sessionMemberId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const booking = await prisma.classBooking.upsert({
    where: { classId_memberId: { classId, memberId } },
    update: { cancelled: false, cancelledAt: null },
    create: { classId, memberId },
  });
  return NextResponse.json(booking, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { classId, memberId } = await req.json();
  const sessionMemberId = (session.user as any)?.memberId;

  if (!classId || !memberId || memberId !== sessionMemberId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.classBooking.updateMany({
    where: { classId, memberId },
    data: { cancelled: true, cancelledAt: new Date() },
  });
  return NextResponse.json({ success: true });
}
