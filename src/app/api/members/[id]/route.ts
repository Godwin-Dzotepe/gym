import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const sessionRole = (session.user as any)?.role;
  const sessionMemberId = (session.user as any)?.memberId;

  // Members can only update their own record; staff/admin can update any
  if (sessionRole === "MEMBER" && sessionMemberId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { password, ...data } = body;

  // Fields members are not allowed to change
  const isMember = sessionRole === "MEMBER";
  const updateData: Record<string, any> = {
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone || null,
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    gender: data.gender || null,
    address: data.address || null,
    city: data.city || null,
    emergencyName: data.emergencyName || null,
    emergencyPhone: data.emergencyPhone || null,
    emergencyRelation: data.emergencyRelation || null,
  };

  // Only staff/admin can update these
  if (!isMember) {
    updateData.notes = data.notes || null;
    updateData.status = data.status;
  }

  const member = await prisma.member.update({ where: { id }, data: updateData });
  return NextResponse.json(member);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionRole = (session.user as any)?.role;
  if (sessionRole === "MEMBER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.member.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
