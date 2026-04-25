import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { activities: { orderBy: { createdAt: "desc" } } },
  });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      source: body.source,
      status: body.status,
      notes: body.notes,
      trialDate: body.trialDate ? new Date(body.trialDate) : undefined,
      convertedAt: body.status === "CONVERTED" ? new Date() : undefined,
    },
  });

  if (body.activityNote) {
    await prisma.leadActivity.create({
      data: { leadId: id, action: body.status ?? "UPDATED", notes: body.activityNote },
    });
  }

  return NextResponse.json(lead);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.leadActivity.deleteMany({ where: { leadId: id } });
  await prisma.lead.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
