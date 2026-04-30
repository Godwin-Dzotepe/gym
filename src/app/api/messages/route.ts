import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendSms } from "@/lib/mnotify";
import { getIntegrationConfig } from "@/lib/integration-config";
import { sendBulkEmail } from "@/lib/email";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const messages = await prisma.message.findMany({
    orderBy: { sentAt: "desc" },
    include: { _count: { select: { recipients: true } } },
  });
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { segment, type, subject, body, memberId } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "Message body required" }, { status: 400 });

  let memberWhere: any = {};
  if (segment === "ALL_ACTIVE")           memberWhere = { status: "ACTIVE" };
  else if (segment === "ALL_MEMBERS")     memberWhere = {};
  else if (segment === "FROZEN")          memberWhere = { status: "FROZEN" };
  else if (segment === "PENDING")         memberWhere = { status: "PENDING" };
  else if (segment === "UNPAID")          memberWhere = { invoices: { some: { status: { in: ["PENDING", "FAILED"] } } } };
  else if (segment === "SPECIFIC_MEMBER") {
    if (!memberId) return NextResponse.json({ error: "memberId required for SPECIFIC_MEMBER segment" }, { status: 400 });
    memberWhere = { id: memberId };
  } else if (segment === "EXPIRING_7D") {
    const in7days = new Date();
    in7days.setDate(in7days.getDate() + 7);
    memberWhere = { memberPlans: { some: { isActive: true, endDate: { lte: in7days, gte: new Date() } } } };
  }

  const members = await prisma.member.findMany({
    where: memberWhere,
    select: { id: true, email: true, phone: true, firstName: true, lastName: true },
  });

  const message = await prisma.message.create({
    data: {
      subject, body, type, segment,
      totalSent: members.length,
      recipients: { create: members.map((m) => ({ memberId: m.id })) },
    },
  });

  const settings = await prisma.gymSettings.findFirst();
  const gymName = settings?.gymName ?? "Oracle Gym";
  const cfg     = getIntegrationConfig(settings);

  let deliveryStatus: "ok" | "failed" | "no_provider" | "no_recipients" = "ok";
  let deliveryError: string | null = null;

  // ── SMS via mNotify ───────────────────────────────────────────────────────────
  if (type === "SMS") {
    if (!cfg.mnotifyKey) {
      deliveryStatus = "no_provider";
      deliveryError  = "No SMS provider configured. Add your mNotify API key in Settings → SMS & Email.";
    } else {
      const phones = members.map(m => m.phone).filter(Boolean) as string[];
      if (phones.length === 0) {
        deliveryStatus = "no_recipients";
        deliveryError  = "No members in this segment have a phone number saved.";
      } else {
        const result = await sendSms(cfg.mnotifyKey, phones, body, gymName);
        if (!result.ok) { deliveryStatus = "failed"; deliveryError = result.error ?? "SMS delivery failed"; }
      }
    }
  }

  // ── Email via Resend / SMTP ───────────────────────────────────────────────────
  if (type === "EMAIL") {
    const withEmail = members.filter(m => m.email) as (typeof members[0] & { email: string })[];
    if (withEmail.length === 0) {
      deliveryStatus = "no_recipients";
      deliveryError  = "No members in this segment have an email address saved.";
    } else if (process.env.RESEND_API_KEY || (cfg.smtpHost && cfg.smtpUser && cfg.smtpPass)) {
      const fromEmail = cfg.smtpFromEmail ?? cfg.smtpUser ?? "noreply@oraclegym.kobby.dev";
      const fromName  = cfg.smtpFromName ?? gymName;

      const { failed } = await sendBulkEmail(
        withEmail.map(m => ({ to: m.email, firstName: m.firstName })),
        subject ?? `Message from ${gymName}`,
        (firstName) => `<p>Hi ${firstName},</p><p>${body.replace(/\n/g, "<br/>")}</p>`,
        fromEmail,
        fromName,
      );

      if (failed > 0 && failed === withEmail.length) {
        deliveryStatus = "failed";
        deliveryError  = "All email deliveries failed. Check your email settings.";
      }
    } else {
      deliveryStatus = "no_provider";
      deliveryError  = "No email provider configured. Add RESEND_API_KEY to your environment variables.";
    }
  }

  return NextResponse.json({ ...message, deliveryStatus, deliveryError }, { status: 201 });
}
