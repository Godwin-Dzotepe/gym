import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import nodemailer from "nodemailer";
import { sendSms, sendEmail as mnotifyEmail } from "@/lib/mnotify";
import { getIntegrationConfig } from "@/lib/integration-config";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { segment, type, subject, body } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "Message body required" }, { status: 400 });

  let memberWhere: any = {};
  if (segment === "ALL_ACTIVE")   memberWhere = { status: "ACTIVE" };
  else if (segment === "ALL_MEMBERS") memberWhere = {};
  else if (segment === "FROZEN")  memberWhere = { status: "FROZEN" };
  else if (segment === "PENDING") memberWhere = { status: "PENDING" };
  else if (segment === "UNPAID")  memberWhere = { invoices: { some: { status: { in: ["PENDING", "FAILED"] } } } };
  else if (segment === "EXPIRING_7D") {
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
  const cfg = getIntegrationConfig(settings);

  if (type === "SMS" && cfg.mnotifyKey) {
    const phones = members.map(m => m.phone).filter(Boolean) as string[];
    if (phones.length > 0) sendSms(cfg.mnotifyKey, phones, body).catch(() => {});
  }

  if (type === "EMAIL") {
    if (cfg.mnotifyKey) {
      const emails = members.map(m => m.email).filter(Boolean) as string[];
      const html = `<p>Hi,</p><p>${body.replace(/\n/g, "<br/>")}</p><p>— ${gymName}</p>`;
      mnotifyEmail(cfg.mnotifyKey, emails, subject ?? `Message from ${gymName}`, html, body, gymName).catch(() => {});
    } else if (cfg.smtpHost && cfg.smtpUser && cfg.smtpPass) {
      const transporter = nodemailer.createTransport({
        host: cfg.smtpHost, port: cfg.smtpPort,
        secure: cfg.smtpPort === 465,
        auth: { user: cfg.smtpUser, pass: cfg.smtpPass },
      });
      Promise.allSettled(
        members.map(m =>
          transporter.sendMail({
            from: `"${gymName}" <${cfg.smtpUser}>`,
            to: m.email,
            subject: subject ?? `Message from ${gymName}`,
            html: `<p>Hi ${m.firstName},</p><p>${body.replace(/\n/g, "<br/>")}</p>`,
            text: `Hi ${m.firstName},\n\n${body}`,
          })
        )
      );
    }
  }

  return NextResponse.json(message, { status: 201 });
}
