import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getIntegrationConfig } from "@/lib/integration-config";
import { sendSms } from "@/lib/mnotify";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionRole = (session.user as any)?.role;
  if (sessionRole === "MEMBER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { action } = await req.json();

  if (!["APPROVE", "DECLINE"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const newStatus = action === "APPROVE" ? "ACTIVE" : "CANCELLED";
  await prisma.member.update({ where: { id }, data: { status: newStatus } });

  const settings = await prisma.gymSettings.findFirst();
  const cfg = getIntegrationConfig(settings);
  const gymName = settings?.gymName ?? "Oracle Gym";

  const approveMsg = `Hi ${member.firstName}, great news! Your membership at ${gymName} has been approved. Your member number is ${member.memberNumber}. Welcome to the family! 💪`;
  const declineMsg = `Hi ${member.firstName}, we regret to inform you that your membership application at ${gymName} could not be approved at this time. Please visit us or contact the gym for more information.`;
  const messageBody = action === "APPROVE" ? approveMsg : declineMsg;

  // Send SMS
  if (member.phone && cfg.mnotifyKey) {
    await sendSms(cfg.mnotifyKey, [member.phone], messageBody).catch(() => {});
  }

  // Send Email
  if (cfg.smtpHost && cfg.smtpUser && cfg.smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: cfg.smtpHost,
        port: cfg.smtpPort ?? 587,
        secure: false,
        auth: { user: cfg.smtpUser, pass: cfg.smtpPass },
      });
      const subject = action === "APPROVE"
        ? `Welcome to ${gymName} — Membership Approved!`
        : `Your ${gymName} Membership Application`;
      await transporter.sendMail({
        from: `"${cfg.smtpFromName}" <${cfg.smtpFromEmail}>`,
        to: member.email,
        subject,
        text: messageBody,
        html: `<p style="font-family:sans-serif;font-size:15px;line-height:1.6">${messageBody.replace(/\n/g, "<br>")}</p>`,
      });
    } catch {}
  }

  return NextResponse.json({ success: true, status: newStatus });
}
