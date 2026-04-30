import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { getDocument } from '../node_modules/pdfjs-dist/legacy/build/pdf.mjs';

const prisma = new PrismaClient();

const PLAN_IDS: Record<string, string> = {
  '2weeks':   'cmogvcjv3000312uisnaidud3',
  '1 month':  'plan-basic',
  '3 months': 'plan-trial',
  '6 months': 'cmogvahlw000212uid7rvejpr',
  'Student':  'plan-student',
  'Couple':   'cmoguv65i000012ui8zwjngqe',
  'Seniors':  'cmogv0e42000112uije2edce0',
};

// Days to subtract from endDate to estimate startDate
const PLAN_DAYS: Record<string, number> = {
  '2weeks':   14,
  '1 month':  30,
  '3 months': 90,
  '6 months': 180,
  'Student':  30,
  'Couple':   30,
  'Seniors':  30,
};

const PLAN_KEYWORDS = ['2weeks','1 month','3 months','6 months','1 year','Student','Couple','Seniors','Family','Day pass','No Active Membership'];

function normPhone(s: string | undefined | null): string | null {
  if (!s) return null;
  let d = s.replace(/\D/g, '');
  if (d.length === 9 && !d.startsWith('0')) d = '0' + d;
  return d.length >= 9 ? d : null;
}

function parseExpiry(text: string): string | null {
  const fwd = text.match(/Expires?\s+(.+?)\s+from\s+now/i);
  if (fwd) {
    const s = fwd[1]; let days = 0;
    const mo = s.match(/(\d+)\s+month/i); if (mo) days += parseInt(mo[1]) * 30;
    const wk = s.match(/(\d+)\s+week/i);  if (wk) days += parseInt(wk[1]) * 7;
    const dy = s.match(/(\d+)\s+day/i);   if (dy) days += parseInt(dy[1]);
    const d = new Date('2026-04-29'); d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }
  const bwd = text.match(/Expired?\s+(.+?)\s+ago/i);
  if (bwd) {
    const s = bwd[1]; let days = 0;
    const mo = s.match(/(\d+)\s+month/i); if (mo) days += parseInt(mo[1]) * 30;
    const wk = s.match(/(\d+)\s+week/i);  if (wk) days += parseInt(wk[1]) * 7;
    const dy = s.match(/(\d+)\s+day/i);   if (dy) days += parseInt(dy[1]);
    const d = new Date('2026-04-29'); d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  }
  return null;
}

async function extractFromPdf(file: string) {
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
  const results: { plan: string; endDate: string | null; phone: string | null; email: string | null }[] = [];
  for (let ai = 0; ai < anchors.length; ai++) {
    const block = planCol.slice(anchors[ai], anchors[ai + 1] ?? planCol.length);
    const planName = block[0].str;
    if (planName === 'No Active Membership') continue;
    const topY = block[0].y, page = block[0].page;
    const bottomY = block[block.length - 1].y;
    const endDate = parseExpiry(block.slice(1).map(i => i.str).join(' '));
    const contacts = contCol.filter(c => c.page === page && c.y >= bottomY - 10 && c.y <= topY + 5);
    const phoneRaw = contacts.find(c => /[\d\s\(\)\-]{9,}/.test(c.str) && !c.str.includes('@'));
    const emailRaw = contacts.find(c => c.str.includes('@'));
    results.push({ plan: planName, endDate, phone: normPhone(phoneRaw?.str), email: emailRaw?.str?.toLowerCase() || null });
  }
  return results;
}

async function main() {
  const files = ['members-report.pdf', 'members-report (2).pdf', 'members-report (3).pdf'];
  const allRecords: { plan: string; endDate: string | null; phone: string | null; email: string | null }[] = [];
  for (const f of files) allRecords.push(...await extractFromPdf(f));

  const valid = allRecords.filter(r => r.endDate && PLAN_IDS[r.plan]);

  let created = 0, skipped = 0, notFound = 0;
  const missed: string[] = [];

  // Process ALL records (no phone dedup — different people can share phones)
  for (const rec of valid) {
    // Find all members matching phone or email
    const candidates: any[] = [];

    if (rec.phone) {
      const found = await prisma.member.findMany({ where: { phone: rec.phone } });
      candidates.push(...found);
    }
    if (rec.email && candidates.length === 0) {
      const user = await prisma.user.findFirst({ where: { email: rec.email }, include: { member: true } });
      if (user?.member) candidates.push(user.member);
    }

    if (candidates.length === 0) {
      notFound++;
      missed.push(`NOT FOUND: phone=${rec.phone} email=${rec.email} plan=${rec.plan}`);
      continue;
    }

    for (const member of candidates) {
      // Skip if already has an active plan (was handled by fix-plan-dates.ts)
      const existing = await prisma.memberPlan.findFirst({ where: { memberId: member.id, isActive: true } });
      if (existing) { skipped++; continue; }

      const planId = PLAN_IDS[rec.plan];
      const endDate = new Date(rec.endDate!);
      endDate.setHours(23, 59, 59, 999);

      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - (PLAN_DAYS[rec.plan] ?? 30));
      startDate.setHours(0, 0, 0, 0);

      await prisma.memberPlan.create({
        data: {
          memberId:      member.id,
          planId,
          startDate,
          endDate,
          isActive:      true,
          paymentMethod: 'CASH',
        },
      });

      // Ensure member status is ACTIVE
      if (member.status !== 'ACTIVE') {
        await prisma.member.update({ where: { id: member.id }, data: { status: 'ACTIVE' } });
      }

      console.log(`✓ Created: ${member.firstName} ${member.lastName} | ${rec.plan} | ${rec.endDate}`);
      created++;
    }
  }

  console.log(`\n── Summary ──────────────────────────────`);
  console.log(`Created:   ${created}`);
  console.log(`Skipped (already had plan): ${skipped}`);
  console.log(`Not found: ${notFound}`);
  if (missed.length) { console.log(`\n── Missed ──`); missed.forEach(m => console.log(m)); }
}

main().catch(console.error).finally(() => prisma.$disconnect());
