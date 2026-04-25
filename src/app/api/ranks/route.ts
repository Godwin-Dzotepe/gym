import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const ranks = await prisma.beltRank.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(ranks);
}

export async function POST(req: Request) {
  const { name, color, order, sessionsRequired, monthsRequired, description, gymType } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const rank = await prisma.beltRank.create({
    data: { name, color, order: order ?? 0, sessionsRequired, monthsRequired, description, gymType: gymType ?? "MARTIAL_ARTS" },
  });
  return NextResponse.json(rank, { status: 201 });
}
