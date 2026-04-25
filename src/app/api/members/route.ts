import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { generateMemberNumber, generatePIN } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));

  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { email: { contains: search } },
      { memberNumber: { contains: search } },
    ];
  }

  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where,
      include: {
        memberPlans: {
          where: { isActive: true },
          include: { plan: true },
          take: 1,
        },
        invoices: {
          where: { status: "PENDING" },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.member.count({ where }),
  ]);

  return NextResponse.json({ members, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    firstName, lastName, email, phone, dateOfBirth, gender,
    address, city, emergencyName, emergencyPhone, emergencyRelation,
    notes, status = "ACTIVE", password,
  } = body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already exists." }, { status: 409 });

  const hashed = await bcrypt.hash(password || "Gym@1234", 12);
  const memberNumber = generateMemberNumber();
  const pin = generatePIN();

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, password: hashed, role: "MEMBER" },
    });
    const member = await tx.member.create({
      data: {
        userId: user.id, memberNumber, firstName, lastName, email,
        phone, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender, address, city, emergencyName, emergencyPhone,
        emergencyRelation, notes, status, pinCode: pin,
      },
    });
    return member;
  });

  await prisma.notification.create({
    data: {
      memberId: result.id,
      type: "NEW_MEMBER",
      title: "New Member Joined",
      message: `${firstName} ${lastName} has joined the gym.`,
      link: `/dashboard/members/${result.id}`,
    },
  });

  return NextResponse.json(result, { status: 201 });
}
