import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { waiverText } = await req.json();

  const member = await prisma.member.update({
    where: { id },
    data: {
      waiverSigned: true,
      waiverSignedAt: new Date(),
      waiverText: waiverText ?? null,
    },
  });

  return NextResponse.json({ waiverSigned: member.waiverSigned, waiverSignedAt: member.waiverSignedAt });
}
