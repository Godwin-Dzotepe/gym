import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { firstName, lastName, phone, position, isActive, role, password } = await req.json();
  const staff = await prisma.staff.findUnique({ where: { id }, include: { user: true } });
  if (!staff) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [updated] = await prisma.$transaction([
    prisma.staff.update({ where: { id }, data: { firstName, lastName, phone, position, isActive }, include: { user: { select: { id: true, email: true, role: true } } } }),
    ...(role ? [prisma.user.update({ where: { id: staff.userId }, data: { role } })] : []),
    ...(password ? [prisma.user.update({ where: { id: staff.userId }, data: { password: bcrypt.hashSync(password, 10) } })] : []),
  ]);
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.staff.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
