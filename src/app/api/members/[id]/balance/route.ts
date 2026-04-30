import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionRole = (session.user as any)?.role;
  if (sessionRole === "MEMBER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { amount } = await req.json();

  if (typeof amount !== "number" || amount === 0) {
    return NextResponse.json({ error: "Valid non-zero amount required" }, { status: 400 });
  }

  const member = await prisma.member.update({
    where: { id },
    data: { balance: { increment: amount } },
    select: { balance: true },
  });

  return NextResponse.json({ balance: Number(member.balance) });
}
