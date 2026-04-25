import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const families = await prisma.family.findMany({
    include: {
      members: { include: { member: { select: { firstName: true, lastName: true, status: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ families });
}

export async function POST(req: NextRequest) {
  const { name, primaryMemberId } = await req.json();
  if (!name || !primaryMemberId) return NextResponse.json({ error: "name and primaryMemberId required" }, { status: 400 });

  const family = await prisma.family.create({
    data: {
      name,
      primaryId: primaryMemberId,
      members: {
        create: {
          memberId: primaryMemberId,
          isPrimary: true,
          relationship: "OTHER",
        },
      },
    },
  });
  return NextResponse.json({ family }, { status: 201 });
}
