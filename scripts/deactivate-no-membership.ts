import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { getDocument } from '../node_modules/pdfjs-dist/legacy/build/pdf.mjs';

const prisma = new PrismaClient();

const PLAN_KEYWORDS = ['2weeks','1 month','3 months','6 months','1 year','Student','Couple','Seniors','Family','Day pass','No Active Membership'];

function normPhone(s: string | undefined | null): string | null {
  if (!s) return null;
  let d = s.replace(/\D/g, '');
  if (d.length === 9 && !d.startsWith('0')) d = '0' + d;
  return d.length >= 9 ? d : null;
}

async function extractNoMembershipContacts(file: string) {
  const data = new Uint8Array(readFileSync(file));
  const doc = await (getDocument as any)({ data }).promise;
  const all: { str: string; x: number; y: number; page: number }[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    (tc.items as any[]).forEach(i => {
      if (i.str && i.str.trim())
        all.push({ str: i.str.trim(), x: Math.round(i.transform[4]), y: Math.round(i.transform[5]), page: p });
    });
  }

  const planCol = all.filter(i => i.x >= 330 && i.x <= 500);
  const contCol = all.filter(i => i.x >= 156 && i.x <= 334);
  planCol.sort((a, b) => a.page - b.page || b.y - a.y);

  const anchors = planCol.reduce<number[]>((acc, item, idx) => {
    if (PLAN_KEYWORDS.some(k => item.str === k)) acc.push(idx);
    return acc;
  }, []);

  const results: { phone: string | null; email: string | null }[] = [];
  for (let ai = 0; ai < anchors.length; ai++) {
    const block = planCol.slice(anchors[ai], anchors[ai + 1] ?? planCol.length);
    if (block[0].str !== 'No Active Membership') continue;

    const topY = block[0].y;
    const bottomY = block[block.length - 1].y;
    const page = block[0].page;

    const contacts = contCol.filter(c => c.page === page && c.y >= bottomY - 10 && c.y <= topY + 5);
    const phoneRaw = contacts.find(c => /[\d\s\(\)\-]{9,}/.test(c.str) && !c.str.includes('@'));
    const emailRaw = contacts.find(c => c.str.includes('@'));

    results.push({ phone: normPhone(phoneRaw?.str), email: emailRaw?.str?.toLowerCase() || null });
  }
  return results;
}

async function main() {
  const files = ['members-report.pdf', 'members-report (2).pdf', 'members-report (3).pdf'];
  const allContacts: { phone: string | null; email: string | null }[] = [];
  for (const f of files) allContacts.push(...await extractNoMembershipContacts(f));

  // Deduplicate
  const seen = new Set<string>();
  const contacts = allContacts.filter(r => {
    const key = r.phone || r.email;
    if (!key) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`Found ${contacts.length} members with No Active Membership in PDFs\n`);

  let deactivated = 0, alreadyCancelled = 0, notFound = 0;
  const missed: string[] = [];

  for (const rec of contacts) {
    let member: any = null;

    if (rec.phone) {
      member = await prisma.member.findFirst({ where: { phone: rec.phone } });
    }
    if (!member && rec.email) {
      const user = await prisma.user.findFirst({ where: { email: rec.email }, include: { member: true } });
      member = user?.member ?? null;
    }

    if (!member) {
      notFound++;
      missed.push(`NOT FOUND: phone=${rec.phone} email=${rec.email}`);
      continue;
    }

    // Deactivate any active plans
    const activePlans = await prisma.memberPlan.findMany({ where: { memberId: member.id, isActive: true } });
    if (activePlans.length > 0) {
      await prisma.memberPlan.updateMany({ where: { memberId: member.id, isActive: true }, data: { isActive: false } });
    }

    // Set member status to CANCELLED (no active membership)
    if (member.status !== 'CANCELLED') {
      await prisma.member.update({ where: { id: member.id }, data: { status: 'CANCELLED' } });
      console.log(`✓ Deactivated: ${member.firstName} ${member.lastName} (${rec.phone ?? rec.email})`);
      deactivated++;
    } else {
      alreadyCancelled++;
    }
  }

  console.log(`\n── Summary ──────────────────────────────`);
  console.log(`Deactivated:      ${deactivated}`);
  console.log(`Already cancelled: ${alreadyCancelled}`);
  console.log(`Not found:        ${notFound}`);
  if (missed.length) { console.log(`\n── Missed ──`); missed.forEach(m => console.log(m)); }
}

main().catch(console.error).finally(() => prisma.$disconnect());
