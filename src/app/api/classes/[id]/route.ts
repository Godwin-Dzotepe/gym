import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      bookings: {
        where: { cancelled: false },
        include: { member: { select: { id: true, firstName: true, lastName: true, email: true, memberNumber: true } } },
        orderBy: { bookedAt: "asc" },
      },
      _count: { select: { bookings: { where: { cancelled: false } } } },
    },
  });
  if (!cls) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(cls);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const cls = await prisma.class.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      location: body.location,
      zoomLink: body.zoomLink,
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
      capacity: body.capacity !== undefined ? (body.capacity ? Number(body.capacity) : null) : undefined,
      isRecurring: body.isRecurring,
      color: body.color,
      isActive: body.isActive,
    },
  });
  return NextResponse.json(cls);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.class.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
