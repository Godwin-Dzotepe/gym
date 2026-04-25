import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const rank = await prisma.beltRank.update({ where: { id }, data });
  return NextResponse.json(rank);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.beltRank.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
