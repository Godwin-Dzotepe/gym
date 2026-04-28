import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import nodemailer from "nodemailer";
import { sendSms } from "@/lib/mnotify";
import { getIntegrationConfig } from "@/lib/integration-config";

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

  // ── Email via Brevo SMTP ──────────────────────────────────────────────────────
  if (type === "EMAIL") {
    const emails = members.map(m => m.email).filter(Boolean) as string[];
    if (emails.length === 0) {
      deliveryStatus = "no_recipients";
      deliveryError  = "No members in this segment have an email address saved.";
    } else if (cfg.smtpHost && cfg.smtpUser && cfg.smtpPass) {
      const from = cfg.smtpFromEmail
        ? `"${cfg.smtpFromName}" <${cfg.smtpFromEmail}>`
        : `"${gymName}" <${cfg.smtpUser}>`;

      const transporter = nodemailer.createTransport({
        host: cfg.smtpHost, port: cfg.smtpPort,
        secure: cfg.smtpPort === 465,
        auth: { user: cfg.smtpUser, pass: cfg.smtpPass },
      });

      const results = await Promise.allSettled(
        members.filter(m => m.email).map(m =>
          transporter.sendMail({
            from,
            to: m.email!,
            subject: subject ?? `Message from ${gymName}`,
            html: `<p>Hi ${m.firstName},</p><p>${body.replace(/\n/g, "<br/>")}</p>`,
            text: `Hi ${m.firstName},\n\n${body}`,
          })
        )
      );

      const failed = results.filter(r => r.status === "rejected");
      if (failed.length === results.length) {
        deliveryStatus = "failed";
        const reason = (failed[0] as PromiseRejectedResult).reason;
        deliveryError = reason?.message ?? "All SMTP deliveries failed. Check your SMTP settings.";
      }
    } else {
      deliveryStatus = "no_provider";
      deliveryError  = "No email provider configured. Add SMTP settings in Settings → SMS & Email.";
    }
  }

  return NextResponse.json({ ...message, deliveryStatus, deliveryError }, { status: 201 });
}
