import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateMemberNumber, generatePIN, generateInvoiceNumber } from "@/lib/utils";

export async function GET() {
  const staff = await prisma.staff.findMany({
    include: { user: { select: { id: true, email: true, role: true } } },
    orderBy: { firstName: "asc" },
  });
  return NextResponse.json(staff);
}

export async function POST(req: Request) {
  const { firstName, lastName, email, password, phone, position, role,
    startDate, endDate, planId, planPaymentMethod } = await req.json();
  if (!firstName || !email || !password)
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, role: role ?? "STAFF" },
    });
    const staff = await prisma.staff.create({
      data: {
        userId: user.id, firstName, lastName, phone, position,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: { user: { select: { id: true, email: true, role: true } } },
    });

    // Optionally create a Member record so staff can have a membership plan
    if (planId) {
      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (plan) {
        const memberNumber = generateMemberNumber();
        const pinCode = generatePIN();
        const member = await prisma.member.create({
          data: { userId: user.id, memberNumber, firstName, lastName, email, pinCode, status: "ACTIVE" },
        });
        let planEnd: Date | null = null;
        if (endDate) {
          planEnd = new Date(endDate);
        } else if (plan.durationType === "LIMITED") {
          planEnd = new Date(startDate ?? new Date());
          if (plan.billingCycle === "DAILY")        planEnd.setDate(planEnd.getDate() + plan.duration);
          else if (plan.billingCycle === "WEEKLY")  planEnd.setDate(planEnd.getDate() + plan.duration * 7);
          else if (plan.billingCycle === "MONTHLY") planEnd.setMonth(planEnd.getMonth() + plan.duration);
          else if (plan.billingCycle === "YEARLY")  planEnd.setFullYear(planEnd.getFullYear() + plan.duration);
        }
        const memberPlan = await prisma.memberPlan.create({
          data: {
            memberId: member.id, planId,
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: planEnd,
            paymentMethod: (planPaymentMethod ?? "MANUAL") as any,
            isActive: true,
          },
        });
        if (Number(plan.price) > 0) {
          await prisma.invoice.create({
            data: {
              invoiceNumber: generateInvoiceNumber(),
              memberId: member.id, memberPlanId: memberPlan.id,
              description: plan.name,
              amount: Number(plan.price), discount: 0, tax: 0, total: Number(plan.price),
              paymentMethod: (planPaymentMethod ?? "MANUAL") as any,
              dueDate: startDate ? new Date(startDate) : new Date(),
              status: "PENDING",
            },
          });
        }
      }
    }

    return NextResponse.json(staff, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }
}
