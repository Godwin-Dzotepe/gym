import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const member = await p.member.findFirst({
    where: { firstName: { contains: 'Beatrice' }, lastName: { contains: 'Brenu' } },
    include: { memberPlans: { include: { plan: true }, orderBy: { startDate: 'desc' } } },
  });

  if (!member) { console.log('Not found'); return; }

  console.log(`Found: ${member.firstName} ${member.lastName} (${member.status})`);
  const today = new Date();
  for (const mp of member.memberPlans) {
    const daysLeft = mp.endDate ? Math.ceil((mp.endDate.getTime() - today.getTime()) / 86400000) : null;
    console.log(`  Plan: ${mp.plan.name} | isActive: ${mp.isActive} | start: ${mp.startDate.toISOString().split('T')[0]} | end: ${mp.endDate?.toISOString().split('T')[0] ?? 'null'} | days left: ${daysLeft}`);
  }

  // Fix: old system says "1 month and 4 days from now"
  // endDate = today + 34 days
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 34);
  endDate.setHours(23, 59, 59, 999);

  // Plan is 3 months (90 days) → startDate = endDate - 90 days
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 90);
  startDate.setHours(0, 0, 0, 0);

  console.log(`\nFix → startDate: ${startDate.toISOString().split('T')[0]}  endDate: ${endDate.toISOString().split('T')[0]}`);

  const activePlan = member.memberPlans.find(mp => mp.isActive);
  if (activePlan) {
    await p.memberPlan.update({
      where: { id: activePlan.id },
      data: { startDate, endDate },
    });
    console.log('✓ Updated.');
  } else {
    console.log('⚠ No active plan found.');
  }
}

main().catch(console.error).finally(() => p.$disconnect());
