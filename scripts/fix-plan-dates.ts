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
    const s = fwd[1];
    let days = 0;
    const mo = s.match(/(\d+)\s+month/i); if (mo) days += parseInt(mo[1]) * 30;
    const wk = s.match(/(\d+)\s+week/i);  if (wk) days += parseInt(wk[1]) * 7;
    const dy = s.match(/(\d+)\s+day/i);   if (dy) days += parseInt(dy[1]);
    const d = new Date('2026-04-29');
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }
  const bwd = text.match(/Expired?\s+(.+?)\s+ago/i);
  if (bwd) {
    const s = bwd[1];
    let days = 0;
    const mo = s.match(/(\d+)\s+month/i); if (mo) days += parseInt(mo[1]) * 30;
    const wk = s.match(/(\d+)\s+week/i);  if (wk) days += parseInt(wk[1]) * 7;
    const dy = s.match(/(\d+)\s+day/i);   if (dy) days += parseInt(dy[1]);
    const d = new Date('2026-04-29');
    d.setDate(d.getDate() - days);
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
      if (i.str && i.str.trim()) {
        all.push({ str: i.str.trim(), x: Math.round(i.transform[4]), y: Math.round(i.transform[5]), page: p });
      }
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

    const topY = block[0].y;
    const bottomY = block[block.length - 1].y;
    const page = block[0].page;
    const expiryTxt = block.slice(1).map(i => i.str).join(' ');
    const endDate = parseExpiry(expiryTxt);

    const contacts = contCol.filter(c => c.page === page && c.y >= bottomY - 10 && c.y <= topY + 5);
    const phoneRaw = contacts.find(c => /[\d\s\(\)\-]{9,}/.test(c.str) && !c.str.includes('@'));
    const emailRaw = contacts.find(c => c.str.includes('@'));

    results.push({
      plan: planName,
      endDate,
      phone: normPhone(phoneRaw?.str),
      email: emailRaw?.str?.toLowerCase() || null,
    });
  }

  return results;
}

async function main() {
  const files = ['members-report.pdf', 'members-report (2).pdf', 'members-report (3).pdf'];
  const allRecords: { plan: string; endDate: string | null; phone: string | null; email: string | null }[] = [];
  for (const f of files) {
    const r = await extractFromPdf(f);
    allRecords.push(...r);
  }

  // Deduplicate by phone (keep first)
  const seen = new Set<string>();
  const records = allRecords.filter(r => {
    const key = r.phone || r.email;
    if (!key || !r.endDate) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`\nExtracted ${records.length} member-plan records from PDFs\n`);

  let updated = 0;
  let notFound = 0;
  let noActivePlan = 0;
  const missed: string[] = [];

  for (const rec of records) {
    // Find member by phone or email
    let member: any = null;

    if (rec.phone) {
      member = await prisma.member.findFirst({ where: { phone: rec.phone } });
    }
    if (!member && rec.email) {
      const user = await prisma.user.findFirst({ where: { email: rec.email }, include: { member: true } });
      member = user?.member ?? null;
    }
    if (!member && rec.email) {
      // Try member directly
      member = await prisma.member.findFirst({ where: { user: { email: rec.email } } });
    }

    if (!member) {
      notFound++;
      missed.push(`NOT FOUND: phone=${rec.phone} email=${rec.email} plan=${rec.plan} endDate=${rec.endDate}`);
      continue;
    }

    // Find their active MemberPlan — prefer one matching the plan from PDF
    const planId = PLAN_IDS[rec.plan];
    let activePlan = planId
      ? await prisma.memberPlan.findFirst({ where: { memberId: member.id, isActive: true, planId } })
      : null;

    if (!activePlan) {
      // Fallback: any active plan for this member
      activePlan = await prisma.memberPlan.findFirst({ where: { memberId: member.id, isActive: true } });
    }

    if (!activePlan) {
      noActivePlan++;
      missed.push(`NO ACTIVE PLAN: ${member.firstName} ${member.lastName} (${rec.phone}) plan=${rec.plan}`);
      continue;
    }

    const endDate = new Date(rec.endDate!);
    endDate.setHours(23, 59, 59, 999);

    await prisma.memberPlan.update({
      where: { id: activePlan.id },
      data: { endDate },
    });

    console.log(`✓ ${member.firstName} ${member.lastName} | ${rec.plan} | endDate → ${rec.endDate}`);
    updated++;
  }

  console.log(`\n── Summary ─────────────────────────────`);
  console.log(`Updated:        ${updated}`);
  console.log(`Not found:      ${notFound}`);
  console.log(`No active plan: ${noActivePlan}`);
  console.log(`\n── Missed ──────────────────────────────`);
  missed.forEach(m => console.log(m));
}

main().catch(console.error).finally(() => prisma.$disconnect());
