import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// In-memory attempt tracking (resets on server restart — sufficient for kiosk)
const attempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const record = attempts.get(ip) ?? { count: 0, lockedUntil: 0 };

  if (record.lockedUntil > now) {
    const secsLeft = Math.ceil((record.lockedUntil - now) / 1000);
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${secsLeft}s.` },
      { status: 429 }
    );
  }

  const { pin } = await req.json();
  const settings = await prisma.gymSettings.findFirst();
  const kioskPin = settings?.kioskPin ?? "1234";

  if (pin === kioskPin) {
    attempts.delete(ip);
    return NextResponse.json({ ok: true });
  }

  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
    record.count = 0;
    attempts.set(ip, record);
    return NextResponse.json({ error: "Too many incorrect attempts. Locked for 5 minutes." }, { status: 429 });
  }

  attempts.set(ip, record);
  const remaining = MAX_ATTEMPTS - record.count;
  return NextResponse.json(
    { error: `Incorrect passcode. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` },
    { status: 401 }
  );
}
