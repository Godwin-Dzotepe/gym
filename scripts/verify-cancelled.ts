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

async function extractAll(file: string) {
  const data = new Uint8Array(readFileSync(file));
  const doc = await (getDocument as any)({ data }).promise;
  const all: { str: string; x: number; y: number; page: number }[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    (tc.items as any[]).forEach((i: any) => {
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

  const noMembership: { phone: string | null; email: string | null }[] = [];
  const hasActivePlan: { phone: string | null; email: string | null; plan: string }[] = [];

  for (let ai = 0; ai < anchors.length; ai++) {
    const block = planCol.slice(anchors[ai], anchors[ai + 1] ?? planCol.length);
    const planName = block[0].str;
    const topY = block[0].y;
    const bottomY = block[block.length - 1].y;
    const page = block[0].page;

    const contacts = contCol.filter(c => c.page === page && c.y >= bottomY - 10 && c.y <= topY + 5);
    const phoneRaw = contacts.find(c => /[\d\s\(\)\-]{9,}/.test(c.str) && !c.str.includes('@'));
    const emailRaw = contacts.find(c => c.str.includes('@'));
    const phone = normPhone(phoneRaw?.str);
    const email = emailRaw?.str?.toLowerCase() || null;

    if (planName === 'No Active Membership') {
      noMembership.push({ phone, email });
    } else {
      hasActivePlan.push({ phone, email, plan: planName });
    }
  }

  return { noMembership, hasActivePlan };
}

async function findMember(phone: string | null, email: string | null) {
  if (phone) {
    const m = await prisma.member.findFirst({ where: { phone } });
    if (m) return m;
  }
  if (email) {
    const user = await prisma.user.findFirst({ where: { email }, include: { member: true } });
    if (user?.member) return user.member;
  }
  return null;
}

async function main() {
  const files = ['members-report.pdf', 'members-report (2).pdf', 'members-report (3).pdf'];

  const allNoMembership: { phone: string | null; email: string | null }[] = [];
  const allHasPlan: { phone: string | null; email: string | null; plan: string }[] = [];

  for (const f of files) {
    const { noMembership, hasActivePlan } = await extractAll(f);
    allNoMembership.push(...noMembership);
    allHasPlan.push(...hasActivePlan);
  }

  // Deduplicate by phone/email
  const seenNo = new Set<string>();
  const noMembershipUniq = allNoMembership.filter(r => {
    const k = r.phone || r.email; if (!k || seenNo.has(k)) return false; seenNo.add(k); return true;
  });
  const seenHas = new Set<string>();
  const hasPlanUniq = allHasPlan.filter(r => {
    const k = r.phone || r.email; if (!k || seenHas.has(k)) return false; seenHas.add(k); return true;
  });

  console.log(`PDF: ${noMembershipUniq.length} no-membership, ${hasPlanUniq.length} with active plan\n`);

  // ── Check 1: PDF says No Membership → should be CANCELLED in system ──
  console.log('═══ PDF: No Active Membership → checking system status ═══');
  const shouldBeCancelledButArent: string[] = [];
  for (const r of noMembershipUniq) {
    const m = await findMember(r.phone, r.email);
    if (!m) continue;
    if (m.status !== 'CANCELLED') {
      shouldBeCancelledButArent.push(`  ✗ ${m.firstName} ${m.lastName} | system: ${m.status} | phone: ${r.phone ?? r.email}`);
    }
  }
  if (shouldBeCancelledButArent.length === 0) {
    console.log('  ✓ All no-membership PDF members are CANCELLED in system');
  } else {
    console.log(`  ${shouldBeCancelledButArent.length} should be CANCELLED but aren't:`);
    shouldBeCancelledButArent.forEach(l => console.log(l));
  }

  // ── Check 2: PDF says has plan → should NOT be CANCELLED in system ──
  console.log('\n═══ PDF: Has Active Plan → checking system status ═══');
  const shouldBeActiveButCancelled: string[] = [];
  for (const r of hasPlanUniq) {
    const m = await findMember(r.phone, r.email);
    if (!m) continue;
    if (m.status === 'CANCELLED') {
      shouldBeActiveButCancelled.push(`  ✗ ${m.firstName} ${m.lastName} | plan: ${r.plan} | phone: ${r.phone ?? r.email}`);
    }
  }
  if (shouldBeActiveButCancelled.length === 0) {
    console.log('  ✓ No active-plan PDF members are wrongly CANCELLED in system');
  } else {
    console.log(`  ${shouldBeActiveButCancelled.length} have a plan in PDF but are CANCELLED in system:`);
    shouldBeActiveButCancelled.forEach(l => console.log(l));
  }

  // ── Check 3: System CANCELLED members not found in PDF as no-membership ──
  console.log('\n═══ System CANCELLED members not in PDF as No Active Membership ═══');
  const cancelledInSystem = await prisma.member.findMany({
    where: { status: 'CANCELLED' },
    select: { id: true, firstName: true, lastName: true, phone: true, user: { select: { email: true } } },
  });
  const pdfNoPhones = new Set(noMembershipUniq.map(r => r.phone).filter(Boolean));
  const pdfNoEmails = new Set(noMembershipUniq.map(r => r.email).filter(Boolean));
  const notInPdf: string[] = [];
  for (const m of cancelledInSystem) {
    const email = (m as any).user?.email?.toLowerCase();
    if (m.phone && pdfNoPhones.has(m.phone)) continue;
    if (email && pdfNoEmails.has(email)) continue;
    notInPdf.push(`  ? ${m.firstName} ${m.lastName} | phone: ${m.phone ?? 'N/A'} | email: ${email ?? 'N/A'}`);
  }
  if (notInPdf.length === 0) {
    console.log('  ✓ All system CANCELLED members appear in PDF as No Active Membership');
  } else {
    console.log(`  ${notInPdf.length} CANCELLED in system but NOT in PDF no-membership list:`);
    notInPdf.forEach(l => console.log(l));
  }

  console.log(`\n── Done ──`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
