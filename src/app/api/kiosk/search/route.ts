import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q") ?? "";

  const members = await prisma.member.findMany({
    where: {
      OR: [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
      ],
      status: { in: ["ACTIVE", "FROZEN"] },
    },
    select: {
      id: true, firstName: true, lastName: true,
      memberNumber: true, status: true,
    },
    take: 8,
  });

  return NextResponse.json({
    members: members.map((m) => ({
      id: m.id,
      name: `${m.firstName} ${m.lastName}`,
      memberNumber: m.memberNumber,
      status: m.status,
    })),
  });
}
