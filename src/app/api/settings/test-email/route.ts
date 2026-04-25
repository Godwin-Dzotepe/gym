import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.gymSettings.findFirst();
  if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPass) {
    return NextResponse.json({ error: "SMTP not configured. Please fill in the Email/SMTP settings first." }, { status: 400 });
  }

  const { to } = await req.json();
  const recipient = to || settings.email || settings.smtpUser;

  try {
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort ?? 587,
      secure: (settings.smtpPort ?? 587) === 465,
      auth: { user: settings.smtpUser, pass: settings.smtpPass },
    });

    await transporter.sendMail({
      from: `"${settings.gymName}" <${settings.smtpUser}>`,
      to: recipient,
      subject: `Test Email from ${settings.gymName}`,
      html: `<p>This is a test email from <strong>${settings.gymName}</strong>.</p><p>Your SMTP settings are working correctly.</p>`,
    });

    return NextResponse.json({ success: true, sentTo: recipient });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to send email." }, { status: 500 });
  }
}
