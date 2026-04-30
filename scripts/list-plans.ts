import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const plans = await p.plan.findMany({ select: { id: true, name: true, billingCycle: true, duration: true } });
  plans.forEach(x => console.log(JSON.stringify(x)));
}
main().catch(console.error).finally(() => p.$disconnect());
