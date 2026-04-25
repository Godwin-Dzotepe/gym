import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const referrals = await prisma.referral.findMany({
    orderBy: { createdAt: "desc" },
  });

  const referrers = await prisma.member.findMany({
    where: { id: { in: [...new Set(referrals.map(r => r.referrerId))] } },
    select: { id: true, firstName: true, lastName: true },
  });

  const referrerMap = Object.fromEntries(referrers.map(m => [m.id, `${m.firstName} ${m.lastName}`]));

  return NextResponse.json(referrals.map(r => ({
    ...r,
    rewardAmount: r.rewardAmount ? Number(r.rewardAmount) : null,
    referrerName: referrerMap[r.referrerId] ?? "Unknown",
  })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { referrerId, referredEmail, referredName, rewardAmount } = await req.json();
  if (!referrerId || !referredEmail || !referredName)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const r = await prisma.referral.create({
    data: { referrerId, referredEmail, referredName, rewardAmount: rewardAmount ? Number(rewardAmount) : null },
  });
  return NextResponse.json(r, { status: 201 });
}
