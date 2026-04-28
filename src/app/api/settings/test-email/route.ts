import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import nodemailer from "nodemailer";
import { getIntegrationConfig } from "@/lib/integration-config";
import { sendEmail as mnotifyEmail } from "@/lib/mnotify";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.gymSettings.findFirst();
  const cfg = getIntegrationConfig(settings);
  const gymName = settings?.gymName ?? "Oracle Gym";

  const { to } = await req.json();
  const recipient = to || settings?.email || cfg.smtpUser;

  if (!recipient) {
    return NextResponse.json({ error: "No recipient email found. Set your gym email in settings." }, { status: 400 });
  }

  // Prefer mNotify email, fall back to SMTP
  if (cfg.mnotifyKey) {
    const ok = await mnotifyEmail(
      cfg.mnotifyKey,
      [recipient],
      `Test Email from ${gymName}`,
      `<p>This is a test email from <strong>${gymName}</strong>. Your mNotify integration is working correctly.</p>`,
      `This is a test email from ${gymName}. Your mNotify integration is working correctly.`,
      gymName,
    );
    if (!ok) return NextResponse.json({ error: "mNotify email failed. Check your API key." }, { status: 500 });
    return NextResponse.json({ success: true, sentTo: recipient, via: "mNotify" });
  }

  if (!cfg.smtpHost || !cfg.smtpUser || !cfg.smtpPass) {
    return NextResponse.json({ error: "No email integration configured. Add MNOTIFY_API_KEY or SMTP settings." }, { status: 400 });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: cfg.smtpHost, port: cfg.smtpPort,
      secure: cfg.smtpPort === 465,
      auth: { user: cfg.smtpUser, pass: cfg.smtpPass },
    });
    await transporter.sendMail({
      from: `"${gymName}" <${cfg.smtpUser}>`,
      to: recipient,
      subject: `Test Email from ${gymName}`,
      html: `<p>This is a test email from <strong>${gymName}</strong>. Your SMTP settings are working correctly.</p>`,
    });
    return NextResponse.json({ success: true, sentTo: recipient, via: "SMTP" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to send email." }, { status: 500 });
  }
}
