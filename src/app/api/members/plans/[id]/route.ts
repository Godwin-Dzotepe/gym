import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { action } = await req.json();

  const updates: any = {};

  switch (action) {
    case "freeze":
      updates.isFrozen = true;
      updates.frozenAt = new Date();
      break;
    case "unfreeze":
      updates.isFrozen = false;
      updates.frozenAt = null;
      updates.frozenUntil = null;
      break;
    case "pause":
      updates.isPaused = true;
      updates.pausedAt = new Date();
      break;
    case "resume":
      updates.isPaused = false;
      updates.pausedAt = null;
      updates.pausedUntil = null;
      break;
    case "cancel":
      updates.isActive = false;
      updates.cancelledAt = new Date();
      break;
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const memberPlan = await prisma.memberPlan.update({ where: { id }, data: updates });
  return NextResponse.json({ memberPlan });
}
