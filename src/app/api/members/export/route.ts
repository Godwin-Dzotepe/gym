import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const planId = searchParams.get("planId");

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
  if (planId) {
    where.memberPlans = { some: { planId, isActive: true } };
  }

  const members = await prisma.member.findMany({
    where,
    include: {
      memberPlans: {
        where: { isActive: true },
        include: { plan: { select: { name: true } } },
        take: 1,
      },
    },
    orderBy: { firstName: "asc" },
  });

  const headers = ["Member #", "First Name", "Last Name", "Email", "Phone", "Status", "Plan", "Join Date", "City"];
  const rows = members.map(m => [
    m.memberNumber,
    m.firstName,
    m.lastName,
    m.email,
    m.phone ?? "",
    m.status,
    m.memberPlans[0]?.plan.name ?? "",
    m.createdAt.toISOString().split("T")[0],
    m.city ?? "",
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="members-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
