import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { generateInvoiceNumber } from "@/lib/utils";

// GET /api/cron/daily  — run once per day at 7am
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const results: Record<string, number> = {
    invoicesMarkedFailed:  0,
    frozenExpired:         0,
    suspendedNonPayers:    0,
    lateFeesApplied:       0,
    ranksAutoPromoted:     0,
    leadReminders:         0,
    birthdaysSent:         0,
  };

  const settings = await prisma.gymSettings.findFirst();
  const gymName         = settings?.gymName       ?? "Oracle Gym";
  const lateFeeAmount   = Number(settings?.lateFeeDefault   ?? 0);
  const lateFeeAfterDays = settings?.lateFeeAfterDays ?? 5;

  // SMTP transporter (optional)
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
    try { await transporter!.sendMail({ from: `"${gymName}" <${settings!.smtpUser}>`, to, subject, html }); }
    catch { /* silent */ }
  }

  // ─── 1. MARK OVERDUE INVOICES AS FAILED ─────────────────────────────────────
  // Any PENDING invoice whose dueDate has passed gets marked FAILED.
  const overdueIds = await prisma.invoice.findMany({
    where: { status: "PENDING", dueDate: { lt: today } },
    select: { id: true, memberId: true, invoiceNumber: true, total: true },
  });

  if (overdueIds.length > 0) {
    await prisma.invoice.updateMany({
      where: { id: { in: overdueIds.map(i => i.id) } },
      data: { status: "FAILED" },
    });

    for (const inv of overdueIds) {
      await prisma.notification.create({
        data: {
          memberId: inv.memberId,
          type: "FAILED_PAYMENT",
          title: "Payment Overdue",
          message: `Invoice ${inv.invoiceNumber} for ${Number(inv.total).toFixed(2)} is now overdue. Please settle your balance to avoid suspension.`,
          link: `/portal/payments`,
        },
      });
    }
    results.invoicesMarkedFailed = overdueIds.length;
  }

  // ─── 2. FREEZE MEMBERS WITH EXPIRED LIMITED PLANS ───────────────────────────
  const expiredPlans = await prisma.memberPlan.findMany({
    where: { isActive: true, endDate: { lt: today } },
    include: { member: true, plan: true },
  });

  for (const mp of expiredPlans) {
    await prisma.memberPlan.update({ where: { id: mp.id }, data: { isActive: false } });

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

  // ─── 3. SUSPEND ONGOING MEMBERS 7+ DAYS PAST nextBillingDate (unpaid) ───────
  const overdueOngoing = await prisma.memberPlan.findMany({
    where: {
      isActive: true,
      plan: { durationType: "ONGOING" },
      nextBillingDate: { lt: today },
    },
    include: { member: true, plan: true },
  });

  for (const mp of overdueOngoing) {
    const unpaid = await prisma.invoice.findFirst({
      where: { memberPlanId: mp.id, status: { in: ["PENDING", "FAILED"] } },
    });

    if (unpaid && mp.member.status === "ACTIVE") {
      const daysOverdue = Math.floor((today.getTime() - (mp.nextBillingDate?.getTime() ?? today.getTime())) / 86400000);
      if (daysOverdue >= 7) {
        await prisma.member.update({ where: { id: mp.memberId }, data: { status: "FROZEN" } });

        await prisma.notification.create({
          data: {
            memberId: mp.memberId,
            type: "FAILED_PAYMENT",
            title: "Membership Suspended",
            message: `Your membership has been suspended due to an unpaid balance of ${Number(unpaid.total).toFixed(2)}. Please settle to regain access.`,
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

  // ─── 4. APPLY LATE FEES ──────────────────────────────────────────────────────
  if (lateFeeAmount > 0) {
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - lateFeeAfterDays);

    const failedInvoices = await prisma.invoice.findMany({
      where: { status: "FAILED", dueDate: { lt: cutoff } },
      include: { member: true },
    });

    for (const inv of failedInvoices) {
      const alreadyFined = await prisma.invoice.findFirst({
        where: {
          memberId: inv.memberId,
          description: { contains: `Late Fee (overdue: ${inv.invoiceNumber})` },
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
          discount: 0, tax: 0,
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
          message: `A late fee of ${lateFeeAmount.toFixed(2)} has been added for overdue invoice ${inv.invoiceNumber}.`,
          link: `/portal/payments`,
        },
      });

      results.lateFeesApplied++;
    }
  }

  // ─── 5. AUTO-PROMOTE RANKS ───────────────────────────────────────────────────
  if (settings?.enableBeltRanks) {
    const ranks = await prisma.beltRank.findMany({ orderBy: { order: "asc" } });

    const activeMembers = await prisma.member.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true, firstName: true, lastName: true,
        createdAt: true,
        _count: { select: { attendances: true } },
        beltRanks: { include: { rank: true }, orderBy: { awardedAt: "desc" }, take: 1 },
      },
    });

    for (const m of activeMembers) {
      const currentRankOrder = m.beltRanks[0]?.rank?.order ?? -1;
      const nextRank = ranks.find(r => r.order > currentRankOrder);
      if (!nextRank) continue;

      const sessionsHave = m._count.attendances;
      const monthsHave = Math.floor((Date.now() - m.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30));

      const meetsSession = nextRank.sessionsRequired === null || sessionsHave >= nextRank.sessionsRequired;
      const meetsMonths  = nextRank.monthsRequired  === null || monthsHave  >= nextRank.monthsRequired;

      if (!meetsSession || !meetsMonths) continue;

      // Don't re-award if already at this rank
      const alreadyHas = await prisma.memberRank.findFirst({
        where: { memberId: m.id, rankId: nextRank.id },
      });
      if (alreadyHas) continue;

      await prisma.memberRank.create({
        data: { memberId: m.id, rankId: nextRank.id, notes: "Auto-promoted by system" },
      });

      await prisma.notification.create({
        data: {
          memberId: m.id,
          type: "RANK_PROMOTION",
          title: `🥋 Promoted to ${nextRank.name}!`,
          message: `Congratulations ${m.firstName}! You've been automatically promoted to ${nextRank.name} based on your attendance and time with us.`,
          link: `/portal/progress`,
        },
      });

      await sendEmail(
        // get email separately since we didn't include it above
        (await prisma.member.findUnique({ where: { id: m.id }, select: { email: true } }))?.email ?? "",
        `Congratulations! You've been promoted to ${nextRank.name}`,
        `<p>Hi ${m.firstName},</p><p>🥋 You've been promoted to <strong>${nextRank.name}</strong>! Keep up the great work.</p>`
      );

      results.ranksAutoPromoted++;
    }
  }

  // ─── 6. LEAD FOLLOW-UP REMINDERS (3 days no contact) ────────────────────────
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const staleLeads = await prisma.lead.findMany({
    where: { status: { in: ["INQUIRY", "CONTACTED"] }, updatedAt: { lt: threeDaysAgo } },
  });

  for (const lead of staleLeads) {
    const alreadyNotified = await prisma.notification.findFirst({
      where: { type: "SYSTEM", title: { contains: `${lead.firstName} ${lead.lastName}` }, createdAt: { gte: threeDaysAgo } },
    });
    if (alreadyNotified) continue;

    await prisma.notification.create({
      data: {
        type: "SYSTEM",
        title: `Follow up: ${lead.firstName} ${lead.lastName}`,
        message: `Lead ${lead.firstName} ${lead.lastName} (${lead.email}) hasn't been contacted in 3+ days. Status: ${lead.status}.`,
        link: `/dashboard/leads/${lead.id}`,
      },
    });

    results.leadReminders++;
  }

  // ─── 7. BIRTHDAY GREETINGS ────────────────────────────────────────────────────
  const todayMonth = today.getMonth() + 1;
  const todayDay   = today.getDate();

  const birthdayMembers = await prisma.member.findMany({
    where: { dateOfBirth: { not: null }, status: "ACTIVE" },
    select: { id: true, firstName: true, email: true, dateOfBirth: true },
  });

  for (const m of birthdayMembers) {
    if (!m.dateOfBirth) continue;
    const dob = new Date(m.dateOfBirth);
    if (dob.getMonth() + 1 !== todayMonth || dob.getDate() !== todayDay) continue;

    const alreadySent = await prisma.notification.findFirst({
      where: { memberId: m.id, title: { contains: "Birthday" }, createdAt: { gte: today } },
    });
    if (alreadySent) continue;

    await prisma.notification.create({
      data: {
        memberId: m.id,
        type: "SYSTEM",
        title: `🎂 Happy Birthday, ${m.firstName}!`,
        message: `Happy Birthday ${m.firstName}! Wishing you a wonderful day from all of us at ${gymName}.`,
        link: `/portal`,
      },
    });

    await sendEmail(
      m.email,
      `Happy Birthday from ${gymName}! 🎂`,
      `<p>Hi ${m.firstName},</p><p>🎂 <strong>Happy Birthday!</strong> Wishing you a fantastic day from all of us at ${gymName}.</p>`
    );

    results.birthdaysSent++;
  }

  return NextResponse.json({ ok: true, date: today.toISOString().split("T")[0], results });
}
