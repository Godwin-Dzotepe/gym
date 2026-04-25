import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: familyId } = await params;
  const { memberId, relationship } = await req.json();

  const fm = await prisma.familyMember.create({
    data: { familyId, memberId, relationship: relationship as any ?? "FAMILY_MEMBER", isPrimary: false },
  });
  return NextResponse.json({ fm }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: familyId } = await params;
  const { memberId } = await req.json();
  await prisma.familyMember.deleteMany({ where: { familyId, memberId } });
  return NextResponse.json({ ok: true });
}
