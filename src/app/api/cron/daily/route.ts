import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { generateInvoiceNumber } from "@/lib/utils";

// GET /api/cron/daily
// Run once per day via scheduler, cron-job.org, or Vercel Cron.
// Handles: freeze expired members, suspend non-payers, late fees,
//          lead follow-up reminders, birthday greetings.

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const results: Record<string, number> = {
    frozenExpired: 0,
    suspendedNonPayers: 0,
    lateFeesApplied: 0,
    leadReminders: 0,
    birthdaysSent: 0,
  };

  const settings = await prisma.gymSettings.findFirst();
  const gymName = settings?.gymName ?? "QYM";
  const lateFeeAmount = Number(settings?.lateFeeDefault ?? 0);
  const lateFeeAfterDays = settings?.lateFeeAfterDays ?? 5;

  // Build email transporter if SMTP configured
  let transporter: nodemailer.Transporter | null = null;
  if (settings?.smtpHost && settings.smtpUser && settings.smtpPass) {
    transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort ?? 587,
      secure: (settings.smtpPort ?? 587) === 465,
      auth: { user: settings.smtpUser, pass: settings.smtpPass },
    });
  }

  async function sendEmail(to: string, subject: string, html: string) {
    if (!transporter || !to) return;
    try { await transporter.sendMail({ from: `"${gymName}" <${settings!.smtpUser}>`, to, subject, html }); }
    catch { /* silent — don't abort cron on email failure */ }
  }

  // ─── 1. FREEZE MEMBERS WITH EXPIRED LIMITED PLANS ──────────────────────────
  const expiredPlans = await prisma.memberPlan.findMany({
    where: { isActive: true, endDate: { lt: today } },
    include: { member: true, plan: true },
  });

  for (const mp of expiredPlans) {
    // Deactivate the plan
    await prisma.memberPlan.update({ where: { id: mp.id }, data: { isActive: false } });

    // Check if member has another active plan
    const otherActive = await prisma.memberPlan.findFirst({
      where: { memberId: mp.memberId, isActive: true, id: { not: mp.id } },
    });

    if (!otherActive && mp.member.status === "ACTIVE") {
      await prisma.member.update({ where: { id: mp.memberId }, data: { status: "FROZEN" } });

      await prisma.notification.create({
        data: {
          memberId: mp.memberId,
          type: "EXPIRING_MEMBERSHIP",
          title: "Membership Expired",
          message: `Your ${mp.plan.name} membership has expired. Please renew to continue accessing the gym.`,
          link: `/portal`,
        },
      });

      await sendEmail(
        mp.member.email,
        `Your ${gymName} membership has expired`,
        `<p>Hi ${mp.member.firstName},</p><p>Your <strong>${mp.plan.name}</strong> membership expired on ${mp.endDate?.toLocaleDateString()}. Please renew to regain access.</p>`
      );

      results.frozenExpired++;
    }
  }

  // ─── 2. SUSPEND ONGOING MEMBERS PAST nextBillingDate WITH UNPAID INVOICE ───
  const overdueOngoing = await prisma.memberPlan.findMany({
    where: {
      isActive: true,
      plan: { durationType: "ONGOING" },
      nextBillingDate: { lt: today },
    },
    include: { member: true, plan: true },
  });

  for (const mp of overdueOngoing) {
    // Check for unpaid invoice for this plan
    const unpaid = await prisma.invoice.findFirst({
      where: { memberPlanId: mp.id, status: { in: ["PENDING", "FAILED"] } },
    });

    if (unpaid && mp.member.status === "ACTIVE") {
      // How many days overdue?
      const daysOverdue = Math.floor((today.getTime() - (mp.nextBillingDate?.getTime() ?? today.getTime())) / 86400000);

      if (daysOverdue >= 7) {
        // Suspend after 7 days of non-payment
        await prisma.member.update({ where: { id: mp.memberId }, data: { status: "FROZEN" } });

        await prisma.notification.create({
          data: {
            memberId: mp.memberId,
            type: "FAILED_PAYMENT",
            title: "Membership Suspended",
            message: `Your membership has been suspended due to an unpaid invoice of ${Number(unpaid.total).toFixed(2)}. Please settle your balance to regain access.`,
            link: `/portal/payments`,
          },
        });

        await sendEmail(
          mp.member.email,
          `Your ${gymName} membership has been suspended`,
          `<p>Hi ${mp.member.firstName},</p><p>Your membership has been suspended due to an outstanding payment of <strong>${Number(unpaid.total).toFixed(2)}</strong>. Please settle your balance to restore access.</p>`
        );

        results.suspendedNonPayers++;
      }
    }
  }

  // ─── 3. APPLY LATE FEES ON OVERDUE INVOICES ─────────────────────────────────
  if (lateFeeAmount > 0) {
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - lateFeeAfterDays);

    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ["PENDING", "FAILED"] },
        dueDate: { lt: cutoff },
      },
      include: { member: true },
    });

    for (const inv of overdueInvoices) {
      // Only apply late fee once per invoice — check if one already exists
      const alreadyFined = await prisma.invoice.findFirst({
        where: {
          memberId: inv.memberId,
          description: { contains: "Late Fee" },
          createdAt: { gte: cutoff },
        },
      });
      if (alreadyFined) continue;

      await prisma.invoice.create({
        data: {
          invoiceNumber: generateInvoiceNumber(),
          memberId: inv.memberId,
          memberPlanId: inv.memberPlanId,
          description: `Late Fee (overdue: ${inv.invoiceNumber})`,
          amount: lateFeeAmount,
          discount: 0,
          tax: 0,
          total: lateFeeAmount,
          paymentMethod: inv.paymentMethod,
          dueDate: today,
          status: "PENDING",
        },
      });

      await prisma.notification.create({
        data: {
          memberId: inv.memberId,
          type: "FAILED_PAYMENT",
          title: "Late Fee Applied",
          message: `A late fee of ${lateFeeAmount.toFixed(2)} has been added to your account for overdue invoice ${inv.invoiceNumber}.`,
          link: `/portal/payments`,
        },
      });

      results.lateFeesApplied++;
    }
  }

  // ─── 4. LEAD FOLLOW-UP REMINDERS (3 days no contact) ────────────────────────
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const staleLead = await prisma.lead.findMany({
    where: {
      status: { in: ["INQUIRY", "CONTACTED"] },
      updatedAt: { lt: threeDaysAgo },
    },
  });

  for (const lead of staleLead) {
    const alreadyNotified = await prisma.notification.findFirst({
      where: {
        type: "SYSTEM",
        title: { contains: lead.firstName },
        createdAt: { gte: threeDaysAgo },
      },
    });
    if (alreadyNotified) continue;

    await prisma.notification.create({
      data: {
        type: "SYSTEM",
        title: `Follow up: ${lead.firstName} ${lead.lastName}`,
        message: `Lead ${lead.firstName} ${lead.lastName} (${lead.email}) has not been contacted in 3+ days. Status: ${lead.status}.`,
        link: `/dashboard/leads/${lead.id}`,
      },
    });

    results.leadReminders++;
  }

  // ─── 5. BIRTHDAY GREETINGS ────────────────────────────────────────────────────
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  const birthdayMembers = await prisma.member.findMany({
    where: {
      dateOfBirth: { not: null },
      status: "ACTIVE",
    },
    select: { id: true, firstName: true, lastName: true, email: true, dateOfBirth: true },
  });

  for (const m of birthdayMembers) {
    if (!m.dateOfBirth) continue;
    const dob = new Date(m.dateOfBirth);
    if (dob.getMonth() + 1 !== todayMonth || dob.getDate() !== todayDay) continue;

    // Don't send twice in the same day
    const alreadySent = await prisma.notification.findFirst({
      where: { memberId: m.id, title: { contains: "Birthday" }, createdAt: { gte: today } },
    });
    if (alreadySent) continue;

    await prisma.notification.create({
      data: {
        memberId: m.id,
        type: "SYSTEM",
        title: `🎂 Happy Birthday, ${m.firstName}!`,
        message: `Happy Birthday ${m.firstName}! Wishing you a wonderful day from all of us at ${gymName}. Keep crushing your fitness goals!`,
        link: `/portal`,
      },
    });

    await sendEmail(
      m.email,
      `Happy Birthday from ${gymName}! 🎂`,
      `<p>Hi ${m.firstName},</p><p>🎂 <strong>Happy Birthday!</strong></p><p>Wishing you a fantastic day from all of us at ${gymName}. Keep up the great work on your fitness journey!</p>`
    );

    results.birthdaysSent++;
  }

  return NextResponse.json({ ok: true, date: today.toISOString().split("T")[0], results });
}
