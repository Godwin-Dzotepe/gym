import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  // "2 weeks": SPECIFIC_DATES/MONTHLY/2 → LIMITED/WEEKLY/2 (14 days)
  const twoWeeks = await p.plan.update({
    where: { id: 'cmogvcjv3000312uisnaidud3' },
    data: { durationType: 'LIMITED', billingCycle: 'WEEKLY', duration: 2 },
  });
  console.log(`Fixed "2 weeks": ${twoWeeks.durationType}/${twoWeeks.billingCycle}/${twoWeeks.duration}`);

  // "Family of 3": SPECIFIC_DATES → LIMITED (keep MONTHLY/1)
  const fam3 = await p.plan.update({
    where: { id: 'cmogvefbt000412uin3p6ito1' },
    data: { durationType: 'LIMITED' },
  });
  console.log(`Fixed "Family of 3": ${fam3.durationType}/${fam3.billingCycle}/${fam3.duration}`);

  // "1 year": YEARLY/12 → YEARLY/1 (12 years → 1 year)
  const oneYear = await p.plan.update({
    where: { id: 'plan-vip' },
    data: { duration: 1 },
  });
  console.log(`Fixed "1 year": ${oneYear.durationType}/${oneYear.billingCycle}/${oneYear.duration}`);

  console.log('\nFinal plan configs:');
  const plans = await p.plan.findMany({ orderBy: { name: 'asc' } });
  for (const pl of plans) {
    console.log(`  ${pl.name.padEnd(20)} | ${pl.durationType.padEnd(16)} | ${pl.billingCycle.padEnd(8)} | duration: ${pl.duration}`);
  }
}

main().catch(console.error).finally(() => p.$disconnect());
