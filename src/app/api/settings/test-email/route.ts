import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getIntegrationConfig } from "@/lib/integration-config";
import { sendEmail } from "@/lib/email";

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

  const hasResend = !!process.env.RESEND_API_KEY;
  const hasSmtp   = !!(cfg.smtpHost && cfg.smtpUser && cfg.smtpPass);

  if (!hasResend && !hasSmtp) {
    return NextResponse.json({
      error: "No email provider configured. Add RESEND_API_KEY to your environment variables.",
    }, { status: 400 });
  }

  const fromEmail = cfg.smtpFromEmail ?? cfg.smtpUser ?? "noreply@oraclegym.kobby.dev";
  const fromName  = cfg.smtpFromName ?? gymName;

  try {
    await sendEmail({
      to: recipient,
      subject: `Test Email from ${gymName}`,
      html: `<p>This is a test email from <strong>${gymName}</strong>. Your email settings are working correctly.</p>`,
      fromEmail,
      fromName,
    });
    return NextResponse.json({
      success: true,
      sentTo: recipient,
      via: hasResend ? "Resend API" : "SMTP",
      from: `${fromName} <${fromEmail}>`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to send email." }, { status: 500 });
  }
}
