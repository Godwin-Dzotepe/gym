import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

function parseDate(ddmmyyyy: string): Date {
  const [dd, mm, yyyy] = ddmmyyyy.split('/');
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
}

function ph(raw: string): string {
  return raw.replace(/[\s()\-]/g, '');
}

// All cancelled members from the PDF (members-report(1)(1).pdf)
// cancelledAt format: DD/MM/YYYY
const PDF_CANCELLED = [
  // ── PAGE 1 ──
  { name: 'Kenneth blankson',   cancelledAt: '03/04/2026', phone: ph('(020) 205-6455'), email: 'Kennethblankson@yahoo.com' },
  { name: 'Emma adjei',         cancelledAt: '09/03/2026', phone: ph('(024) 678-2373'), email: null },
  { name: 'Zinaya',             cancelledAt: '09/03/2026', phone: null,                  email: null },
  { name: 'Nancy owusu',        cancelledAt: '09/03/2026', phone: ph('(020) 005-5811'), email: null },
  { name: 'Elorm Ribeiro',      cancelledAt: '09/03/2026', phone: ph('(020) 581-2334'), email: null },
  { name: 'Makarius',           cancelledAt: '09/03/2026', phone: ph('(054) 633-8740'), email: null },
  { name: 'Turkson',            cancelledAt: '09/03/2026', phone: ph('(054) 595-4239'), email: null },
  { name: 'Joseph attah',       cancelledAt: '09/03/2026', phone: null,                  email: null },
  { name: 'June joseph',        cancelledAt: '09/03/2026', phone: ph('(050) 704-5531'), email: null },
  { name: 'Delmar',             cancelledAt: '09/03/2026', phone: ph('(055) 741-3423'), email: null },
  { name: 'Christabel',         cancelledAt: '09/03/2026', phone: ph('(050) 549-2110'), email: null },
  { name: 'Festus amoah',       cancelledAt: '09/03/2026', phone: ph('(020) 270-5486'), email: null },
  { name: 'Samuel Amponsah',    cancelledAt: '09/03/2026', phone: ph('(053) 547-4404'), email: null },
  { name: 'Steven darku',       cancelledAt: '09/03/2026', phone: ph('(024) 221-9227'), email: null },
  { name: 'Igwe',               cancelledAt: '09/03/2026', phone: ph('(050) 918-1819'), email: null },
  { name: 'Sheron',             cancelledAt: '09/03/2026', phone: null,                  email: 'shergaag@gmail.com' },
  { name: 'Festus Amoah',       cancelledAt: '09/03/2026', phone: ph('(053) 304-0251'), email: null },
  { name: 'Michael hardest',    cancelledAt: '09/03/2026', phone: ph('(055) 714-6711'), email: null },
  { name: 'Cilla',              cancelledAt: '09/03/2026', phone: ph('(054) 324-4644'), email: 'yhaacuty57@gmail.com' },
  { name: 'Yaw aceampong',      cancelledAt: '09/03/2026', phone: ph('(053) 658-2349'), email: 'yawachwampong391@gmail.com' },
  // ── PAGE 2 ──
  { name: 'Gideon Bafo',        cancelledAt: '09/03/2026', phone: ph('(024) 808-9368'), email: null },
  { name: 'Clara benson',       cancelledAt: '09/03/2026', phone: ph('(059) 151-1603'), email: null },
  { name: 'Mrs. amdtfey',       cancelledAt: '09/03/2026', phone: ph('(050) 423-0071'), email: null },
  { name: 'Ekow abaka',         cancelledAt: '09/03/2026', phone: ph('(020) 379-1330'), email: 'ekowabakanamoo@gmail.com' },
  { name: 'Naa adjeley',        cancelledAt: '09/03/2026', phone: null,                  email: null },
  { name: 'Getty adzawulah',    cancelledAt: '09/03/2026', phone: ph('(054) 073-3783'), email: null },
  { name: 'Peter kusi',         cancelledAt: '09/03/2026', phone: ph('(054) 161-3706'), email: 'peter-kusiboateng@yahoo.com' },
  { name: 'Mariam Twumasi',     cancelledAt: '09/03/2026', phone: ph('(024) 354-4066'), email: 'mtwunasi16@gmail.com' },
  { name: 'Jowell asamoah',     cancelledAt: '09/03/2026', phone: ph('(059) 266-8879'), email: null },
  { name: 'kwesi honam',        cancelledAt: '09/03/2026', phone: ph('(053) 054-3130'), email: null },
  { name: 'Josh manorty',       cancelledAt: '09/03/2026', phone: ph('(053) 012-2458'), email: null },
  { name: 'michael Voodo',      cancelledAt: '09/03/2026', phone: ph('(055) 714-6711'), email: null },
  { name: 'Delmar Graham',      cancelledAt: '09/03/2026', phone: ph('(055) 741-3424'), email: 'grahamdelmar2@gmail.com' },
  { name: 'Kafui Nutor',        cancelledAt: '12/03/2026', phone: ph('(055) 585-6446'), email: 'nutorkafuu990@gmail.com' },
  { name: 'Christabel ofosuwa', cancelledAt: '09/03/2026', phone: ph('(050) 549-2110'), email: null },
  { name: 'Abdullahi Abubakar', cancelledAt: '12/03/2026', phone: ph('(055) 045-6125'), email: 'officialdagizag@gmail.com' },
  { name: 'Della Ama',          cancelledAt: '09/03/2026', phone: ph('(026) 126-5194'), email: null },
  { name: 'Erogbogbo gabriel',  cancelledAt: '12/03/2026', phone: null,                  email: 'gabrielerogbogbo@gmail.com' },
  { name: 'Secheriah idiku',    cancelledAt: '09/03/2026', phone: null,                  email: null },
  { name: 'Joseph yaw',         cancelledAt: '09/03/2026', phone: ph('(059) 813-5250'), email: null },
  { name: 'Commando',           cancelledAt: '09/03/2026', phone: ph('(024) 885-1017'), email: null },
  { name: 'Rosa Lartey',        cancelledAt: '09/03/2026', phone: ph('(024) 445-8107'), email: null },
  // ── PAGE 3 ──
  { name: 'Andrew Ansah',       cancelledAt: '15/04/2026', phone: ph('(053) 326-4263'), email: 'andy0445@yahoo.com' },
  { name: 'Nene Dorson',        cancelledAt: '19/03/2026', phone: ph('(020) 290-0358'), email: null },
  { name: 'Vic mensah',         cancelledAt: '20/03/2026', phone: ph('(024) 381-0858'), email: 'joelmensah1738@gmail.com' },
];

async function findMember(rec: typeof PDF_CANCELLED[0]) {
  if (rec.phone) {
    const m = await p.member.findFirst({ where: { phone: rec.phone } });
    if (m) return m;
  }
  if (rec.email) {
    const u = await p.user.findFirst({
      where: { email: rec.email.toLowerCase() },
      include: { member: true },
    });
    if (u?.member) return u.member;
  }
  // Last resort: name search (first name only — PDF sometimes gives one name)
  const firstName = rec.name.split(' ')[0];
  const lastName  = rec.name.split(' ').slice(1).join(' ');
  if (lastName) {
    const m = await p.member.findFirst({
      where: {
        firstName: { contains: firstName },
        lastName:  { contains: lastName  },
      },
    });
    if (m) return m;
  }
  return null;
}

async function main() {
  let updated = 0, notFound = 0;
  const missed: string[] = [];

  for (const rec of PDF_CANCELLED) {
    const cancelledAt = parseDate(rec.cancelledAt);
    const member = await findMember(rec);

    if (!member) {
      notFound++;
      missed.push(`NOT FOUND: ${rec.name} | phone: ${rec.phone ?? '—'} | email: ${rec.email ?? '—'}`);
      continue;
    }

    // Deactivate all active plans and stamp cancelledAt
    const activePlans = await p.memberPlan.findMany({
      where: { memberId: member.id, isActive: true },
    });
    for (const mp of activePlans) {
      await p.memberPlan.update({
        where: { id: mp.id },
        data: { isActive: false, cancelledAt },
      });
    }

    // Also stamp cancelledAt on any plan that already has cancelledAt=null
    await p.memberPlan.updateMany({
      where: { memberId: member.id, cancelledAt: null },
      data: { cancelledAt },
    });

    // Set member status to CANCELLED
    await p.member.update({
      where: { id: member.id },
      data: { status: 'CANCELLED' },
    });

    console.log(`✓ ${rec.name.padEnd(24)} | cancelled: ${rec.cancelledAt} | DB: ${member.firstName} ${member.lastName}`);
    updated++;
  }

  console.log(`\n── Summary ───────────────────────────────`);
  console.log(`Updated:   ${updated}`);
  console.log(`Not found: ${notFound}`);
  if (missed.length) {
    console.log(`\nNot found in DB (name only, no contact — skipped):`);
    missed.forEach(m => console.log(' ', m));
  }
}

main().catch(console.error).finally(() => p.$disconnect());
