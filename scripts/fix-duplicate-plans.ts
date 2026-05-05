import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// Deactivate stale duplicate active plans — keep only the most recent active plan per member.
async function main() {
  const members = await p.member.findMany({
    include: {
      memberPlans: {
        where: { isActive: true },
        orderBy: { startDate: 'desc' },
      },
    },
  });

  let fixed = 0;
  for (const m of members) {
    if (m.memberPlans.length <= 1) continue;
    // Keep the first (newest startDate), deactivate the rest
    const [, ...stale] = m.memberPlans;
    for (const s of stale) {
      await p.memberPlan.update({ where: { id: s.id }, data: { isActive: false, cancelledAt: new Date() } });
      console.log(`Fixed: ${m.firstName} ${m.lastName} — cancelled stale plan (endDate: ${s.endDate?.toISOString().split('T')[0] ?? 'null'})`);
      fixed++;
    }
  }
  console.log(`\nTotal stale plans deactivated: ${fixed}`);
}

main().catch(console.error).finally(() => p.$disconnect());
