import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { memberId, rankId, notes } = await req.json();
  if (!memberId || !rankId) return NextResponse.json({ error: "memberId and rankId required" }, { status: 400 });
  const promotion = await prisma.memberRank.create({
    data: { memberId, rankId, notes },
    include: { rank: true, member: { select: { firstName: true, lastName: true } } },
  });
  // Auto-update member status if needed and create notification
  await prisma.notification.create({
    data: {
      memberId,
      type: "RANK_PROMOTION",
      title: "Rank Promotion",
      message: `${promotion.member.firstName} ${promotion.member.lastName} was promoted to ${promotion.rank.name}`,
      link: `/dashboard/members/${memberId}`,
    },
  });
  return NextResponse.json(promotion, { status: 201 });
}
