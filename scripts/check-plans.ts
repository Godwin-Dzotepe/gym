import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.plan.findMany({ select: { id: true, name: true, billingCycle: true, durationType: true } });
  console.log(JSON.stringify(plans, null, 2));
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
