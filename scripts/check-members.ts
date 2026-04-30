import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.member.count();
  const last = await prisma.member.findMany({ orderBy: { memberNumber: 'desc' }, take: 3, select: { memberNumber: true, firstName: true, lastName: true } });
  console.log('Total members:', count);
  console.log('Last inserted:', last);
}
main().then(() => prisma.$disconnect()).catch(e => { console.error(e); process.exit(1); });
