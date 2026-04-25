import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

// Called by a scheduler (e.g. cron job, Vercel Cron, or external ping).
// Safe to call multiple times per day — tracks sent state to avoid duplicates.
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.gymSettings.findFirst();
  if (!settings?.expiryNotifEnabled) {
    return NextResponse.json({ skipped: true, reason: "Notifications disabled" });
  }

  const notifyDays = settings.expiryNotifDays;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const windowEnd = new Date(today);
  windowEnd.setDate(windowEnd.getDate() + notifyDays);

  const expiringPlans = await prisma.memberPlan.findMany({
    where: { isActive: true, endDate: { gte: today, lte: windowEnd } },
    include: {
      member: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      plan: { select: { name: true } },
    },
  });

  const gymName = settings.gymName;
  const emailTemplate = settings.expiryNotifEmailTemplate ?? "Hi {name}, your membership at {gym} expires in {days} day(s) on {date}. Please renew to keep access.";

  // Build SMTP transporter once if email notifications are enabled
  let transporter: nodemailer.Transporter | null = null;
  if (settings.expiryNotifEmail && settings.smtpHost && settings.smtpUser && settings.smtpPass) {
    transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort ?? 587,
      secure: (settings.smtpPort ?? 587) === 465,
      auth: { user: settings.smtpUser, pass: settings.smtpPass },
    });
  }

  let sent = 0;
  let emailsSent = 0;

  for (const mp of expiringPlans) {
    if (!mp.endDate) continue;

    const endDate = new Date(mp.endDate);
    endDate.setHours(0, 0, 0, 0);
    const daysLeft = Math.round((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const triggerDays = [notifyDays, Math.max(1, notifyDays - 3), 0];
    if (!triggerDays.includes(daysLeft)) continue;

    const member = mp.member;

    const renewed = await prisma.memberPlan.findFirst({
      where: { memberId: member.id, isActive: true, endDate: { gt: endDate } },
    });
    if (renewed) continue;

    const alreadySent = await prisma.notification.findFirst({
      where: {
        memberId: member.id,
        type: "EXPIRY_REMINDER",
        createdAt: { gte: today },
        message: { contains: `${daysLeft} day` },
      },
    });
    if (alreadySent) continue;

    const dateStr = endDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const vars: Record<string, string> = { name: member.firstName, gym: gymName, days: String(daysLeft), date: dateStr, plan: mp.plan.name };
    const interpolate = (tpl: string) => tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);

    const expiredTemplate = `Hi {name}, your {gym} membership ({plan}) has expired today. Please renew to regain access.`;
    const title = daysLeft === 0 ? "Membership Expired" : `Membership Expiring in ${daysLeft} Day${daysLeft === 1 ? "" : "s"}`;
    const message = interpolate(daysLeft === 0 ? expiredTemplate : emailTemplate);

    await prisma.notification.create({
      data: { memberId: member.id, type: "EXPIRY_REMINDER", title, message, link: `/dashboard/members/${member.id}` },
    });

    // Send email
    if (transporter && member.email) {
      try {
        const subject = daysLeft === 0 ? `Your ${gymName} membership has expired` : `Your ${gymName} membership expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
        await transporter.sendMail({
          from: `"${gymName}" <${settings.smtpUser}>`,
          to: member.email,
          subject,
          html: `<p>${message.replace(/\n/g, "<br/>")}</p>`,
          text: message,
        });
        emailsSent++;
      } catch {
        // Log silently — don't let one bad email abort the whole batch
      }
    }

    sent++;
  }

  return NextResponse.json({ ok: true, processed: expiringPlans.length, sent, emailsSent });
}
