import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateMemberNumber, generatePIN, generateInvoiceNumber } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      firstName, lastName, email, phone, dateOfBirth, gender,
      address, emergencyName, emergencyPhone, password, waiverAccepted,
      planId, billingCycle, paymentMethod,
    } = body;

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: "Required fields missing." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const memberNumber = generateMemberNumber();
    const pin = generatePIN();

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, password: hashed, role: "MEMBER" },
      });

      const member = await tx.member.create({
        data: {
          userId: user.id,
          memberNumber,
          firstName, lastName, email,
          phone: phone || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          gender: gender || null,
          address: address || null,
          emergencyName: emergencyName || null,
          emergencyPhone: emergencyPhone || null,
          status: "PENDING",
          waiverSigned: waiverAccepted ?? false,
          waiverSignedAt: waiverAccepted ? new Date() : null,
          pinCode: pin,
        },
      });

      // Assign plan if selected
      if (planId && billingCycle) {
        const plan = await tx.plan.findUnique({ where: { id: planId } });
        if (plan) {
          const cyclePrice: Record<string, number | null> = {
            DAILY:   plan.dailyPrice   ? Number(plan.dailyPrice)   : null,
            WEEKLY:  plan.weeklyPrice  ? Number(plan.weeklyPrice)  : null,
            MONTHLY: plan.monthlyPrice ? Number(plan.monthlyPrice) : Number(plan.price),
            YEARLY:  plan.yearlyPrice  ? Number(plan.yearlyPrice)  : null,
          };
          const price = cyclePrice[billingCycle] ?? Number(plan.price);

          // Calculate end date
          let endDate: Date | null = null;
          if (plan.durationType === "LIMITED") {
            endDate = new Date();
            if (billingCycle === "DAILY")        endDate.setDate(endDate.getDate() + plan.duration);
            else if (billingCycle === "WEEKLY")  endDate.setDate(endDate.getDate() + plan.duration * 7);
            else if (billingCycle === "MONTHLY") endDate.setMonth(endDate.getMonth() + plan.duration);
            else if (billingCycle === "YEARLY")  endDate.setFullYear(endDate.getFullYear() + plan.duration);
          }

          const memberPlan = await tx.memberPlan.create({
            data: {
              memberId: member.id,
              planId,
              startDate: new Date(),
              endDate,
              paymentMethod: (paymentMethod ?? "CASH") as any,
              isActive: true,
            },
          });

          if (price > 0) {
            await tx.invoice.create({
              data: {
                invoiceNumber: generateInvoiceNumber(),
                memberId: member.id,
                memberPlanId: memberPlan.id,
                description: `${plan.name} (${billingCycle.charAt(0) + billingCycle.slice(1).toLowerCase()})`,
                amount: price,
                discount: 0,
                tax: 0,
                total: price,
                paymentMethod: (paymentMethod ?? "CASH") as any,
                dueDate: new Date(),
                status: "PENDING",
              },
            });
          }
        }
      }
    });

    // Auto-credit referrer if a matching unconverted referral exists
    const referral = await prisma.referral.findFirst({
      where: { referredEmail: email, converted: false },
    });
    if (referral) {
      const reward = referral.rewardAmount ? Number(referral.rewardAmount) : 0;
      await prisma.$transaction([
        prisma.referral.update({
          where: { id: referral.id },
          data: { converted: true, convertedAt: new Date(), rewardGiven: reward > 0 },
        }),
        ...(reward > 0 ? [
          prisma.member.update({
            where: { id: referral.referrerId },
            data: { balance: { increment: reward } },
          }),
        ] : []),
      ]);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
