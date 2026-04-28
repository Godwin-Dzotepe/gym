import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import nodemailer from "nodemailer";
import { getIntegrationConfig } from "@/lib/integration-config";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.gymSettings.findFirst();
  const cfg      = getIntegrationConfig(settings);
  const gymName  = settings?.gymName ?? "Oracle Gym";

  const { to } = await req.json();
  const recipient = to || settings?.email || cfg.smtpUser;

  if (!recipient) {
    return NextResponse.json({ error: "No recipient email found. Set your gym email in settings." }, { status: 400 });
  }

  if (!cfg.smtpHost || !cfg.smtpUser || !cfg.smtpPass) {
    return NextResponse.json({ error: "No SMTP settings configured. Add SMTP_HOST, SMTP_USER, and SMTP_PASS." }, { status: 400 });
  }

  const from = cfg.smtpFromEmail
    ? `"${cfg.smtpFromName}" <${cfg.smtpFromEmail}>`
    : `"${gymName}" <${cfg.smtpUser}>`;

  try {
    const transporter = nodemailer.createTransport({
      host: cfg.smtpHost, port: cfg.smtpPort,
      secure: cfg.smtpPort === 465,
      auth: { user: cfg.smtpUser, pass: cfg.smtpPass },
    });
    await transporter.sendMail({
      from,
      to: recipient,
      subject: `Test Email from ${gymName}`,
      html: `<p>This is a test email from <strong>${gymName}</strong>. Your Brevo SMTP settings are working correctly.</p>`,
    });
    return NextResponse.json({ success: true, sentTo: recipient, via: "Brevo SMTP", from });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to send email." }, { status: 500 });
  }
}
