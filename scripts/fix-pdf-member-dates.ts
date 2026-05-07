import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const BASE = new Date('2026-05-05');

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  r.setHours(23, 59, 59, 999);
  return r;
}

function subDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - n);
  r.setHours(0, 0, 0, 0);
  return r;
}

function relToDays(mo: number, wk: number, dy: number) {
  return mo * 30 + wk * 7 + dy;
}

// Plan duration in days (for back-calculating startDate)
const PLAN_DAYS: Record<string, number> = {
  '2weeks':           14,
  '1 month':          30,
  '3 months':         90,
  '6 months':         180,
  'Student':          30,
  'Staff membership': 30,
};

const PLAN_IDS: Record<string, string> = {
  '2weeks':           'cmogvcjv3000312uisnaidud3',
  '1 month':          'plan-basic',
  '3 months':         'plan-trial',
  '6 months':         'cmogvahlw000212uid7rvejpr',
  'Student':          'plan-student',
  'Staff membership': 'plan-staff',
};

// Exactly the 20 members from the PDF
const PDF_MEMBERS = [
  { name: 'Miki Akazara',                 phone: '0242326777', email: 'mikiakazara@gmail.com',      plan: '6 months',        days: relToDays(0,0,180) },
  { name: 'William Atisu',                phone: '0244655247', email: null,                         plan: '1 month',         days: relToDays(0,4,2)  },
  { name: 'Kirk Boye',                    phone: '0557475927', email: null,                         plan: '2weeks',          days: relToDays(0,1,6)  },
  { name: 'Ella Chilaka',                 phone: '0597987275', email: null,                         plan: '2weeks',          days: relToDays(0,1,6)  },
  { name: 'Anthony Dzamefe',              phone: '0541185114', email: null,                         plan: '3 months',        days: relToDays(2,4,2)  },
  { name: 'Charles Kuranchie',            phone: '0205940932', email: null,                         plan: '3 months',        days: relToDays(2,4,1)  },
  { name: 'Abass Sampson',               phone: '0558662700', email: null,                         plan: 'Staff membership', days: relToDays(0,1,5) },
  { name: 'Ivy Emefa',                    phone: '0508294794', email: 'ivyemefa@yahoo.com',         plan: '1 month',         days: relToDays(0,4,0)  },
  { name: 'Isaac Kwakye',                 phone: '0543900851', email: 'isaacarshauin@gmail.com',    plan: 'Student',         days: relToDays(0,4,0)  },
  { name: 'Alfred Senyegah',              phone: '0556767487', email: null,                         plan: '1 month',         days: relToDays(0,4,0)  },
  { name: 'Desmond Addo',                 phone: '0594850108', email: 'emusk7154@gmail.com',        plan: '2weeks',          days: relToDays(0,1,3)  },
  { name: 'Nana Adjoa',                   phone: '0534516054', email: 'adwoapinamand193@gmail.com', plan: '2weeks',          days: relToDays(0,1,3)  },
  { name: 'Kofi Amponsah Boakye-Yiadom', phone: '0553341030', email: 'amponsah.boakyey@gmail.com', plan: '2weeks',          days: relToDays(0,1,3)  },
  { name: 'Nana Oppong',                  phone: '0595886607', email: 'nadjei82@yahoo.com',         plan: '1 month',         days: relToDays(0,3,5)  },
  { name: 'Amadu Musah',                  phone: '0553028022', email: 'rufaimusah5@gmail.com',      plan: '1 month',         days: relToDays(0,3,4)  },
  { name: 'Emmanuel Dankyi',              phone: '0504972569', email: 'ed@turdemoji.lol',           plan: '3 months',        days: relToDays(2,3,3)  },
  { name: 'Otu Michael',                  phone: '0500007090', email: 'milceotu8@gmail.com',        plan: '3 months',        days: relToDays(2,3,3)  },
  { name: 'Prozy Promise',                phone: '0538112026', email: 'itzprozzy@gmail.com',        plan: '2weeks',          days: relToDays(0,1,1)  },
  { name: 'Asante Richard',               phone: '0506771007', email: 'higherfly95@gmail.com',      plan: '2weeks',          days: relToDays(0,1,1)  },
  { name: 'Clemence Torsu',               phone: '0201694695', email: 'cdodzi@gmail.com',           plan: '6 months',        days: relToDays(0,0,180) },
];

async function findMember(phone: string, email: string | null) {
  const m = await p.member.findFirst({ where: { phone } });
  if (m) return m;
  if (email) {
    const u = await p.user.findFirst({ where: { email: email.toLowerCase() }, include: { member: true } });
    if (u?.member) return u.member;
  }
  return null;
}

async function main() {
  console.log('PDF member date fix — reading backwards from expiry to get join date\n');
  console.log('Name'.padEnd(32) + 'Plan'.padEnd(16) + 'Start (joined)'.padEnd(16) + 'End (expires)');
  console.log('─'.repeat(80));

  let ok = 0, skipped = 0;

  for (const rec of PDF_MEMBERS) {
    const planId    = PLAN_IDS[rec.plan];
    const planDays  = PLAN_DAYS[rec.plan];
    const endDate   = addDays(BASE, rec.days);         // from PDF
    const startDate = subDays(endDate, planDays);      // joined = expires - plan duration

    const member = await findMember(rec.phone, rec.email);
    if (!member) {
      console.log(`⚠ NOT FOUND: ${rec.name}`);
      skipped++;
      continue;
    }

    // Find their active plan record matching this planId
    const mp = await p.memberPlan.findFirst({
      where: { memberId: member.id, planId, isActive: true },
    });

    if (!mp) {
      console.log(`⚠ No active ${rec.plan} plan for ${rec.name}`);
      skipped++;
      continue;
    }

    await p.memberPlan.update({
      where: { id: mp.id },
      data: { startDate, endDate },
    });

    const s = startDate.toISOString().split('T')[0];
    const e = endDate.toISOString().split('T')[0];
    console.log(`✓ ${rec.name.padEnd(32)}${rec.plan.padEnd(16)}${s.padEnd(16)}${e}`);
    ok++;
  }

  console.log(`\n✓ Updated: ${ok}  ⚠ Skipped: ${skipped}`);
}

main().catch(console.error).finally(() => p.$disconnect());
