import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { firstName, lastName, email, phone, source, status, notes, trialDate } = body;
  if (!firstName || !lastName || !email)
    return NextResponse.json({ error: "firstName, lastName, email required" }, { status: 400 });

  const lead = await prisma.lead.create({
    data: {
      firstName, lastName, email, phone,
      source, notes,
      status: status ?? "INQUIRY",
      trialDate: trialDate ? new Date(trialDate) : null,
    },
  });
  return NextResponse.json(lead, { status: 201 });
}
