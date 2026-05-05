import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const plans = await p.plan.findMany({ orderBy: { name: 'asc' } });
  for (const pl of plans) {
    console.log(`${pl.name.padEnd(20)} | durationType: ${String(pl.durationType).padEnd(16)} | billingCycle: ${String(pl.billingCycle).padEnd(8)} | duration: ${pl.duration}`);
  }
}
main().catch(console.error).finally(() => p.$disconnect());
