import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { pin, memberId, method, checkedInAt } = await req.json();

  let member;

  if (pin) {
    member = await prisma.member.findFirst({ where: { pinCode: pin } });
  } else if (memberId) {
    member = await prisma.member.findUnique({ where: { id: memberId } });
  }

  if (!member) {
    return NextResponse.json({ error: "Member not found. Please try again." }, { status: 404 });
  }

  if (member.status !== "ACTIVE") {
    return NextResponse.json(
      { error: `Your membership is ${member.status.toLowerCase()}. Please contact the front desk.` },
      { status: 403 }
    );
  }

  // Check for unpaid invoices
  const unpaid = await prisma.invoice.count({
    where: { memberId: member.id, status: { in: ["PENDING", "FAILED"] } },
  });

  if (unpaid > 0) {
    return NextResponse.json(
      { error: "You have outstanding payments. Please settle your balance at the front desk." },
      { status: 403 }
    );
  }

  // Record attendance
  const attendanceData: any = { memberId: member.id, method: method ?? "PIN" };
  if (checkedInAt) {
    attendanceData.checkedInAt = new Date(checkedInAt);
    attendanceData.isBackdated = true;
    attendanceData.originalDate = new Date(checkedInAt);
  }
  await prisma.attendance.create({ data: attendanceData });

  // Attendance milestone notifications
  const totalAttendance = await prisma.attendance.count({ where: { memberId: member.id } });
  const MILESTONES = [10, 25, 50, 100, 200, 500];
  if (MILESTONES.includes(totalAttendance)) {
    await prisma.notification.create({
      data: {
        memberId: member.id,
        type: "ATTENDANCE_MILESTONE",
        title: `🏆 ${totalAttendance} Sessions!`,
        message: `Congratulations ${member.firstName}! You've completed ${totalAttendance} sessions at the gym. Keep it up!`,
        link: `/portal/attendance`,
      },
    });
  }

  // Get active plan
  const activePlan = await prisma.memberPlan.findFirst({
    where: { memberId: member.id, isActive: true },
    include: { plan: { select: { name: true } } },
  });

  return NextResponse.json({
    member: {
      name: `${member.firstName} ${member.lastName}`,
      plan: activePlan?.plan.name ?? "No active plan",
      status: member.status,
      totalAttendance,
      milestone: MILESTONES.includes(totalAttendance) ? totalAttendance : null,
    },
  });
}
