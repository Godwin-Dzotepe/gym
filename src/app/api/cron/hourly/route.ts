import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

// GET /api/cron/hourly — run every hour
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { classRemindersSent: 0 };

  const settings = await prisma.gymSettings.findFirst();
  const gymName    = settings?.gymName ?? "Oracle Gym";
  const fromEmail  = settings?.email ?? process.env.SMTP_FROM_EMAIL ?? "noreply@oraclegym.kobby.dev";
  const fromName   = settings?.gymName ?? gymName;

  // ─── CLASS REMINDERS: notify booked members 1 hour before class starts ───────
  const now = new Date();
  const windowStart = new Date(now.getTime() + 55 * 60 * 1000);   // ~55 min from now
  const windowEnd   = new Date(now.getTime() + 65 * 60 * 1000);   // ~65 min from now

  const upcomingClasses = await prisma.class.findMany({
    where: { isActive: true, startTime: { gte: windowStart, lte: windowEnd } },
    select: {
      title: true,
      startTime: true,
      bookings: {
        where: { cancelled: false },
        select: { member: { select: { id: true, firstName: true, email: true } } },
      },
    },
  });

  for (const cls of upcomingClasses) {
    for (const booking of cls.bookings) {
      const member = booking.member;

      // Dedup: skip if already sent today for this class
      const alreadySent = await prisma.notification.findFirst({
        where: {
          memberId: member.id,
          type: "SYSTEM",
          title: { contains: cls.title },
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
        },
      });
      if (alreadySent) continue;

      const startLabel = cls.startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      await prisma.notification.create({
        data: {
          memberId: member.id,
          type: "SYSTEM",
          title: `Reminder: ${cls.title} starts soon`,
          message: `Your class "${cls.title}" starts at ${startLabel}. See you there!`,
          link: `/portal/classes`,
        },
      });

      if (member.email) {
        await sendEmail({
          to: member.email,
          subject: `Reminder: ${cls.title} starts in ~1 hour`,
          html: `<p>Hi ${member.firstName},</p><p>Just a reminder that <strong>${cls.title}</strong> starts at <strong>${startLabel}</strong>. See you soon!</p>`,
          fromEmail,
          fromName,
        }).catch(() => {});
      }

      results.classRemindersSent++;
    }
  }

  return NextResponse.json({ ok: true, results });
}
