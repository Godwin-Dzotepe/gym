import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Total members
  const total = await prisma.member.count();
  console.log(`\n=== MEMBER COUNTS ===`);
  console.log(`Total members: ${total}`);

  // By status
  const statuses = await prisma.member.groupBy({
    by: ["status"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });
  console.log(`\n--- By Status ---`);
  for (const s of statuses) {
    console.log(`  ${s.status.padEnd(12)} ${s._count.id}`);
  }

  // Total users
  const totalUsers = await prisma.user.count();
  console.log(`\nTotal users: ${totalUsers}`);

  // By role
  const roles = await prisma.user.groupBy({
    by: ["role"],
    _count: { id: true },
  });
  console.log(`\n--- By Role ---`);
  for (const r of roles) {
    console.log(`  ${r.role.padEnd(14)} ${r._count.id}`);
  }

  // Plans
  const plans = await prisma.plan.findMany({
    select: { id: true, name: true, isActive: true, _count: { select: { memberPlans: true } } },
    orderBy: { name: "asc" },
  });
  console.log(`\n=== PLANS (${plans.length} total) ===`);
  for (const p of plans) {
    console.log(`  ${p.name.padEnd(30)} ${p._count.memberPlans} members  ${p.isActive ? "✓ active" : "✗ inactive"}`);
  }

  // MemberPlans
  const totalMemberPlans = await prisma.memberPlan.count();
  const activeMemberPlans = await prisma.memberPlan.count({ where: { isActive: true } });
  console.log(`\n=== MEMBER PLANS ===`);
  console.log(`  Total assignments: ${totalMemberPlans}`);
  console.log(`  Active:            ${activeMemberPlans}`);
  console.log(`  Inactive:          ${totalMemberPlans - activeMemberPlans}`);

  // Members without any plan
  const membersWithoutPlan = await prisma.member.count({
    where: { memberPlans: { none: {} } },
  });
  console.log(`\n  Members with NO plan: ${membersWithoutPlan}`);

  // Invoices summary
  const invoicesByStatus = await prisma.invoice.groupBy({
    by: ["status"],
    _count: { id: true },
    _sum: { total: true },
  });
  if (invoicesByStatus.length > 0) {
    console.log(`\n=== INVOICES ===`);
    for (const inv of invoicesByStatus) {
      console.log(`  ${inv.status.padEnd(12)} ${String(inv._count.id).padEnd(6)} (total: ${inv._sum.total})`);
    }
  }

  // Payments summary
  const paymentCount = await prisma.payment.count();
  console.log(`\nTotal payments: ${paymentCount}`);

  // GymSettings
  const settings = await prisma.gymSettings.findFirst({ select: { gymName: true, currency: true, gymType: true } });
  if (settings) {
    console.log(`\n=== GYM SETTINGS ===`);
    console.log(`  Name:     ${settings.gymName}`);
    console.log(`  Currency: ${settings.currency}`);
    console.log(`  Type:     ${settings.gymType}`);
  }

  console.log("");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
