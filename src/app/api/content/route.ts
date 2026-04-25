import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.contentItem.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { title, description, type, url, isPublished, accessByRank, accessByPlan } = body;
  if (!title || !type) return NextResponse.json({ error: "title and type required" }, { status: 400 });

  const item = await prisma.contentItem.create({
    data: { title, description, type, url, isPublished: isPublished ?? false, accessByRank, accessByPlan },
  });
  return NextResponse.json(item, { status: 201 });
}
