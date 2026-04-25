import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const classes = await prisma.class.findMany({ orderBy: { startTime: "asc" } });
  return NextResponse.json(classes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { title, description, location, zoomLink, startTime, endTime, capacity, isRecurring, color } = body;
  if (!title || !startTime || !endTime)
    return NextResponse.json({ error: "title, startTime, endTime required" }, { status: 400 });

  const cls = await prisma.class.create({
    data: {
      title, description, location, zoomLink,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      capacity: capacity ? Number(capacity) : null,
      isRecurring: isRecurring ?? false,
      color: color ?? "#4f46e5",
    },
  });
  return NextResponse.json(cls, { status: 201 });
}
