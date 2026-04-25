import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name } = await req.json();
  const family = await prisma.family.update({ where: { id }, data: { name } });
  return NextResponse.json(family);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.familyMember.deleteMany({ where: { familyId: id } });
  await prisma.family.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
