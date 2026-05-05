import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

// PDF creation date: 2026-05-05
const BASE = new Date('2026-05-05');

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  r.setHours(23, 59, 59, 999);
  return r;
}

function relToDays(mo: number, wk: number, dy: number) {
  return mo * 30 + wk * 7 + dy;
}

function generateMemberNumber() {
  return `GYM-${Math.floor(10000 + Math.random() * 90000)}`;
}

// Stable placeholder password hash (not a real password — member must reset)
function placeholderHash(phone: string) {
  return createHash('sha256').update('placeholder-' + phone).digest('hex');
}

// Plan ID map (from list-plans.ts output)
const PLAN_IDS: Record<string, string> = {
  '2weeks':           'cmogvcjv3000312uisnaidud3',
  '1 month':          'plan-basic',
  '3 months':         'plan-trial',
  '6 months':         'cmogvahlw000212uid7rvejpr',
  'Student':          'plan-student',
  'Couple':           'cmoguv65i000012ui8zwjngqe',
  'Seniors':          'cmogv0e42000112uije2edce0',
  'Staff membership': 'plan-staff',
};

// Members extracted from PDF (deduplicated — William Atisu appears twice with same phone/days, kept once)
const PDF_MEMBERS = [
  // name, phone (normalised), email, plan key, expiry days from BASE
  { name: 'Miki Akazara',                phone: '0242326777', email: 'mikiakazara@gmail.com',      plan: '6 months',        days: relToDays(0,0,180) },
  { name: 'William Atisu',               phone: '0244655247', email: null,                         plan: '1 month',         days: relToDays(0,4,2)  },
  { name: 'Kirk Boye',                   phone: '0557475927', email: null,                         plan: '2weeks',          days: relToDays(0,1,6)  },
  { name: 'Ella Chilaka',                phone: '0597987275', email: null,                         plan: '2weeks',          days: relToDays(0,1,6)  },
  { name: 'Anthony Dzamefe',             phone: '0541185114', email: null,                         plan: '3 months',        days: relToDays(2,4,2)  },
  { name: 'Charles Kuranchie',           phone: '0205940932', email: null,                         plan: '3 months',        days: relToDays(2,4,1)  },
  { name: 'Abass Sampson',              phone: '0558662700', email: null,                         plan: 'Staff membership', days: relToDays(0,1,5)  },
  { name: 'Ivy Emefa',                   phone: '0508294794', email: 'ivyemefa@yahoo.com',         plan: '1 month',         days: relToDays(0,4,0)  },
  { name: 'Isaac Kwakye',                phone: '0543900851', email: 'isaacarshauin@gmail.com',    plan: 'Student',         days: relToDays(0,4,0)  },
  { name: 'Alfred Senyegah',             phone: '0556767487', email: null,                         plan: '1 month',         days: relToDays(0,4,0)  },
  { name: 'Desmond Addo',                phone: '0594850108', email: 'emusk7154@gmail.com',        plan: '2weeks',          days: relToDays(0,1,3)  },
  { name: 'Nana Adjoa',                  phone: '0534516054', email: 'adwoapinamand193@gmail.com', plan: '2weeks',          days: relToDays(0,1,3)  },
  { name: 'Kofi Amponsah Boakye-Yiadom',phone: '0553341030', email: 'amponsah.boakyey@gmail.com', plan: '2weeks',          days: relToDays(0,1,3)  },
  { name: 'Nana Oppong',                 phone: '0595886607', email: 'nadjei82@yahoo.com',         plan: '1 month',         days: relToDays(0,3,5)  },
  { name: 'Amadu Musah',                 phone: '0553028022', email: 'rufaimusah5@gmail.com',      plan: '1 month',         days: relToDays(0,3,4)  },
  { name: 'Emmanuel Dankyi',             phone: '0504972569', email: 'ed@turdemoji.lol',           plan: '3 months',        days: relToDays(2,3,3)  },
  { name: 'Otu Michael',                 phone: '0500007090', email: 'milceotu8@gmail.com',        plan: '3 months',        days: relToDays(2,3,3)  },
  { name: 'Prozy Promise',               phone: '0538112026', email: 'itzprozzy@gmail.com',        plan: '2weeks',          days: relToDays(0,1,1)  },
  { name: 'Asante Richard',              phone: '0506771007', email: 'higherfly95@gmail.com',      plan: '2weeks',          days: relToDays(0,1,1)  },
  { name: 'Clemence Torsu',              phone: '0201694695', email: 'cdodzi@gmail.com',           plan: '6 months',        days: relToDays(0,0,180) },
];

async function ensureStaffPlan() {
  const existing = await prisma.plan.findUnique({ where: { id: 'plan-staff' } });
  if (!existing) {
    await prisma.plan.create({
      data: {
        id: 'plan-staff',
        name: 'Staff membership',
        planType: 'RECURRING',
        billingCycle: 'MONTHLY',
        duration: 1,
        price: 0,
        isActive: true,
      },
    });
    console.log('✓ Created Staff membership plan');
  }
}

async function findMember(phone: string, email: string | null) {
  const m = await prisma.member.findFirst({ where: { phone } });
  if (m) return m;
  if (email) {
    const u = await prisma.user.findFirst({ where: { email: email.toLowerCase() }, include: { member: true } });
    if (u?.member) return u.member;
    return await prisma.member.findFirst({ where: { user: { email: email.toLowerCase() } } });
  }
  return null;
}

async function createMember(rec: typeof PDF_MEMBERS[0]): Promise<{ id: string; firstName: string; lastName: string; status: string }> {
  const [firstName, ...rest] = rec.name.trim().split(' ');
  const lastName = rest.join(' ') || '—';

  // Generate a unique email if none provided (phone-based placeholder)
  const email = rec.email ?? `${rec.phone}@noemail.gym`;

  // Ensure email not already taken
  const existingUser = await prisma.user.findFirst({ where: { email } });
  if (existingUser?.member) return existingUser.member as any;

  const memberNumber = generateMemberNumber();

  const user = await prisma.user.create({
    data: {
      email,
      password: placeholderHash(rec.phone),
      role: 'MEMBER',
    },
  });

  const member = await prisma.member.create({
    data: {
      userId: user.id,
      memberNumber,
      firstName,
      lastName,
      email,
      phone: rec.phone,
      status: 'ACTIVE',
    },
  });

  return member;
}

async function main() {
  await ensureStaffPlan();

  let updated = 0, created = 0, newMembers = 0, planChanged = 0;

  for (const rec of PDF_MEMBERS) {
    const planId  = PLAN_IDS[rec.plan];
    const endDate = addDays(BASE, rec.days);

    if (!planId) {
      console.log(`⚠ Unknown plan: ${rec.plan} for ${rec.name}`);
      continue;
    }

    let member = await findMember(rec.phone, rec.email);

    if (!member) {
      member = await createMember(rec);
      newMembers++;
      console.log(`+ Created member: ${member.firstName} ${member.lastName}`);
    }

    // Deactivate any incorrect active plans first
    const activePlans = await prisma.memberPlan.findMany({
      where: { memberId: member.id, isActive: true },
    });

    const correctPlan = activePlans.find(p => p.planId === planId);
    const wrongPlans  = activePlans.filter(p => p.planId !== planId);

    for (const wp of wrongPlans) {
      await prisma.memberPlan.update({ where: { id: wp.id }, data: { isActive: false } });
      planChanged++;
    }

    if (correctPlan) {
      await prisma.memberPlan.update({
        where: { id: correctPlan.id },
        data: { endDate },
      });
      updated++;
    } else {
      await prisma.memberPlan.create({
        data: {
          memberId:      member.id,
          planId,
          startDate:     BASE,
          endDate,
          isActive:      true,
          paymentMethod: 'CASH',
        },
      });
      created++;
    }

    if (member.status !== 'ACTIVE') {
      await prisma.member.update({ where: { id: member.id }, data: { status: 'ACTIVE' } });
    }

    const endStr = endDate.toISOString().split('T')[0];
    console.log(`✓ ${member.firstName} ${member.lastName} | ${rec.plan} → ${endStr}${wrongPlans.length ? ' (plan corrected)' : ''}`);
  }

  console.log(`\n── Summary ──────────────────────────────────`);
  console.log(`New members created: ${newMembers}`);
  console.log(`Updated endDate:     ${updated}`);
  console.log(`New plan assigned:   ${created}`);
  console.log(`Wrong plan fixed:    ${planChanged}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
