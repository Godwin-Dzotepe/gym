import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function rnd<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rndInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function daysAgo(n: number) { return new Date(Date.now() - n * 86400000); }
function daysFromNow(n: number) { return new Date(Date.now() + n * 86400000); }

const FIRST_NAMES = ["James","John","Robert","Michael","William","David","Richard","Joseph","Thomas","Charles","Mary","Patricia","Jennifer","Linda","Barbara","Susan","Jessica","Sarah","Karen","Lisa","Daniel","Mark","Donald","George","Kenneth","Steven","Edward","Brian","Ronald","Anthony","Kevin","Jason","Matthew","Gary","Timothy","Jose","Larry","Jeffrey","Frank","Scott","Eric","Stephen","Andrew","Raymond","Gregory","Joshua","Jerry","Dennis","Walter","Patrick","Emma","Olivia","Ava","Isabella","Sophia","Charlotte","Mia","Amelia","Harper","Evelyn","Abigail","Emily","Elizabeth","Mila","Ella","Avery","Sofia","Camila","Aria","Scarlett","Victoria","Madison","Luna","Grace","Chloe","Penelope","Layla","Riley","Zoey","Nora","Lily","Eleanor","Hannah","Lillian","Addison","Aubrey","Ellie","Stella","Natalie","Zoe","Leah","Hazel","Violet","Aurora","Savannah","Audrey","Brooklyn","Bella","Claire","Skylar","Lucy","Paisley","Everly","Anna","Caroline","Nova","Genesis","Emilia","Kennedy","Samantha"];
const LAST_NAMES = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores","Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts","Owens","Bennett","Fisher","Powell","Long","Patterson","Hughes","Flores","Butler","Coleman","Perry","Jenkins","Richardson","Murphy","Ward","Sanders","Price","Ross","Morales","Howard","Morgan","Bailey","Foster","Bryant","Russell","Alexander","Griffin","Diaz","Hayes"];
const POSITIONS = ["Personal Trainer","Front Desk","Nutritionist","Yoga Instructor","Spin Instructor","Kickboxing Coach","Manager","Receptionist","Cleaner","Security"];
const PRODUCT_NAMES = ["Protein Shake","Energy Bar","Water Bottle","Gym Towel","Resistance Band","Jump Rope","Foam Roller","Gym Gloves","Protein Powder 1kg","Pre-Workout","BCAA Drink","Creatine Powder","Yoga Mat","Gym Bag","Sports Socks","Headband","Shaker Bottle","Fitness Tracker","Knee Sleeve","Compression Shirt"];
const CLASS_TITLES = ["Morning Yoga","HIIT Bootcamp","Spin Class","Pilates Core","Kickboxing Fundamentals","Strength & Conditioning","Zumba Dance","CrossFit WOD","Aqua Aerobics","Boxing Cardio","Meditation & Stretch","Power Lifting","Functional Fitness","Body Pump","TRX Suspension","Barre Fusion","Circuit Training","Kettlebell Flow","Plyometrics","Athletic Speed"];
const LEAD_SOURCES = ["Walk-in","Instagram","Facebook","Google","Referral","Flyer","Event","Website","TikTok","Friend"];
const CONTENT_TYPES = ["VIDEO","PDF","ARTICLE","LINK"];
const CONTENT_TITLES = [
  "Beginner's Guide to Weightlifting","Nutrition 101: Macros Explained","5-Minute Morning Warm-Up Routine",
  "How to Do a Perfect Squat","Recovery & Rest Day Tips","Meal Prep for Gym Goers",
  "Understanding Heart Rate Zones","Yoga for Flexibility","HIIT vs Steady-State Cardio",
  "The Importance of Hydration","Foam Rolling Techniques","Building a Home Workout Routine",
];

async function main() {
  console.log("🌱 Seeding comprehensive data...\n");

  // ─── Gym Settings ───────────────────────────────────────────
  await prisma.gymSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      gymName: "QYM Fitness",
      gymType: "FITNESS",
      address: "123 Fitness Avenue, Accra, Ghana",
      phone: "+233 20 123 4567",
      email: "info@qymfitness.com",
      currency: "GHS",
      timezone: "Africa/Accra",
      enableBeltRanks: true,
      enableReferrals: true,
      enablePOS: true,
      portalEnabled: true,
      portalShowPayments: true,
      portalShowMembershipCard: true,
      taxRate: 0,
      lateFeeDefault: 10,
      lateFeeAfterDays: 5,
      kioskPin: "1234",
    },
  });
  console.log("✅ Gym settings");

  // ─── Plans ──────────────────────────────────────────────────
  const plans = await Promise.all([
    prisma.plan.upsert({ where: { id: "plan-basic" }, update: {}, create: { id: "plan-basic", name: "Basic", description: "Gym floor access during regular hours", price: 150, monthlyPrice: 150, weeklyPrice: 45, dailyPrice: 10, billingCycle: "MONTHLY", durationType: "ONGOING", isActive: true } }),
    prisma.plan.upsert({ where: { id: "plan-premium" }, update: {}, create: { id: "plan-premium", name: "Premium", description: "Unlimited access + all group classes", price: 250, monthlyPrice: 250, weeklyPrice: 75, yearlyPrice: 2500, billingCycle: "MONTHLY", durationType: "ONGOING", isActive: true } }),
    prisma.plan.upsert({ where: { id: "plan-vip" }, update: {}, create: { id: "plan-vip", name: "VIP Annual", description: "Full access + personal training sessions", price: 2200, yearlyPrice: 2200, monthlyPrice: 200, billingCycle: "YEARLY", durationType: "LIMITED", duration: 12, isActive: true } }),
    prisma.plan.upsert({ where: { id: "plan-student" }, update: {}, create: { id: "plan-student", name: "Student", description: "Discounted rate for students", price: 100, monthlyPrice: 100, billingCycle: "MONTHLY", durationType: "ONGOING", isActive: true } }),
    prisma.plan.upsert({ where: { id: "plan-family" }, update: {}, create: { id: "plan-family", name: "Family", description: "Up to 4 family members", price: 400, monthlyPrice: 400, billingCycle: "MONTHLY", durationType: "ONGOING", isFamilyShared: true, maxMembers: 4, familyDiscount2nd: 20, familyDiscount3rd: 30, isActive: true } }),
    prisma.plan.upsert({ where: { id: "plan-trial" }, update: {}, create: { id: "plan-trial", name: "7-Day Trial", description: "Try us for a week", price: 30, dailyPrice: 30, billingCycle: "DAILY", planType: "TRIAL", durationType: "LIMITED", duration: 7, isActive: true } }),
  ]);
  console.log("✅ Plans (6)");

  // ─── Admin ───────────────────────────────────────────────────
  const adminPw = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@qym.com" }, update: {},
    create: { email: "admin@qym.com", password: adminPw, role: "SUPER_ADMIN",
      staff: { create: { firstName: "Super", lastName: "Admin", position: "Administrator", isActive: true } } },
  });

  // ─── Staff ───────────────────────────────────────────────────
  const staffData = [
    { email: "jane.smith@qym.com",   fn: "Jane",    ln: "Smith",    pos: "Front Desk" },
    { email: "kwame.asante@qym.com", fn: "Kwame",   ln: "Asante",   pos: "Personal Trainer" },
    { email: "abena.osei@qym.com",   fn: "Abena",   ln: "Osei",     pos: "Yoga Instructor" },
    { email: "kofi.mensah@qym.com",  fn: "Kofi",    ln: "Mensah",   pos: "Manager" },
    { email: "ama.adjei@qym.com",    fn: "Ama",     ln: "Adjei",    pos: "Nutritionist" },
  ];
  const staffPw = await bcrypt.hash("staff123", 10);
  for (const s of staffData) {
    await prisma.user.upsert({
      where: { email: s.email }, update: {},
      create: { email: s.email, password: staffPw, role: "STAFF",
        staff: { create: { firstName: s.fn, lastName: s.ln, position: s.pos, isActive: true, startDate: daysAgo(rndInt(30, 365)) } } },
    });
  }
  console.log("✅ Staff (6 including admin)");

  // ─── Members ─────────────────────────────────────────────────
  const memberPw = await bcrypt.hash("member123", 10);
  const memberRecords: any[] = [];
  const statuses = ["ACTIVE","ACTIVE","ACTIVE","ACTIVE","ACTIVE","ACTIVE","PENDING","FROZEN","CANCELLED"];
  const genders = ["Male","Female","Other"];
  const selectedPlans = [plans[0], plans[1], plans[1], plans[2], plans[3], plans[4], plans[5]];

  for (let i = 0; i < 40; i++) {
    const fn = rnd(FIRST_NAMES);
    const ln = rnd(LAST_NAMES);
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.com`;
    const status = rnd(statuses);
    const plan = rnd(selectedPlans);
    const joinedAgo = rndInt(5, 400);
    const memberNumber = `GYM-${10001 + i}`;

    try {
      const user = await prisma.user.upsert({
        where: { email }, update: {},
        create: { email, password: memberPw, role: "MEMBER" },
      });

      const member = await prisma.member.upsert({
        where: { email }, update: {},
        create: {
          userId: user.id,
          memberNumber,
          firstName: fn, lastName: ln, email,
          phone: `+233 ${rndInt(20,59)} ${rndInt(100,999)} ${rndInt(1000,9999)}`,
          gender: rnd(genders),
          status: status as any,
          pinCode: String(rndInt(1000, 9999)),
          waiverSigned: true,
          waiverSignedAt: daysAgo(joinedAgo),
          address: `${rndInt(1, 99)} ${rnd(["Oak St","Main Rd","King Ave","Palm Blvd","Lake Dr"])}, Accra`,
          emergencyName: `${rnd(FIRST_NAMES)} ${rnd(LAST_NAMES)}`,
          emergencyPhone: `+233 ${rndInt(20,59)} ${rndInt(100,999)} ${rndInt(1000,9999)}`,
          createdAt: daysAgo(joinedAgo),
        },
      });

      // Assign plan (only ACTIVE members)
      if (status === "ACTIVE") {
        const existingPlan = await prisma.memberPlan.findFirst({ where: { memberId: member.id } });
        if (!existingPlan) {
          const planPrice = Number(plan.monthlyPrice ?? plan.price);
          const endDate = plan.durationType === "LIMITED" ? daysFromNow(rndInt(10, 365)) : null;
          const mp = await prisma.memberPlan.create({
            data: {
              memberId: member.id, planId: plan.id,
              startDate: daysAgo(joinedAgo),
              endDate,
              nextBillingDate: daysFromNow(rndInt(1, 30)),
              paymentMethod: rnd(["CASH","BANK_TRANSFER","CARD"]) as any,
              isActive: true,
            },
          });

          // Invoice for current period
          await prisma.invoice.create({
            data: {
              invoiceNumber: `INV-${Date.now()}-${i}`,
              memberId: member.id,
              memberPlanId: mp.id,
              description: `${plan.name} - Monthly`,
              amount: planPrice, discount: 0, tax: 0, total: planPrice,
              paymentMethod: rnd(["CASH","BANK_TRANSFER","CARD"]) as any,
              status: rnd(["PAID","PAID","PAID","PENDING"]) as any,
              dueDate: daysAgo(rndInt(0, 30)),
              paidAt: rnd([null, daysAgo(rndInt(0, 15))]),
            },
          });

          // Previous month invoice (PAID)
          if (joinedAgo > 35) {
            const prevMp2 = await prisma.memberPlan.findFirst({ where: { memberId: member.id } });
            await prisma.invoice.create({
              data: {
                invoiceNumber: `INV-${Date.now()}-${i}-prev`,
                memberId: member.id,
                memberPlanId: prevMp2?.id,
                description: `${plan.name} - Previous Month`,
                amount: planPrice, discount: 0, tax: 0, total: planPrice,
                paymentMethod: "CASH" as any,
                status: "PAID" as any,
                dueDate: daysAgo(rndInt(31, 60)),
                paidAt: daysAgo(rndInt(31, 55)),
              },
            });
          }
        }
      }

      memberRecords.push(member);
    } catch { /* skip duplicate */ }
  }

  // Known test member
  const testUser = await prisma.user.upsert({
    where: { email: "john@example.com" }, update: {},
    create: { email: "john@example.com", password: memberPw, role: "MEMBER" },
  });
  const testMember = await prisma.member.upsert({
    where: { email: "john@example.com" }, update: {},
    create: {
      userId: testUser.id, memberNumber: "GYM-00001",
      firstName: "John", lastName: "Doe", email: "john@example.com",
      phone: "+233 20 555 0100", gender: "Male", status: "ACTIVE",
      pinCode: "1234", waiverSigned: true, waiverSignedAt: daysAgo(90),
    },
  });
  const existingTestPlan = await prisma.memberPlan.findFirst({ where: { memberId: testMember.id } });
  if (!existingTestPlan) {
    const mp = await prisma.memberPlan.create({
      data: { memberId: testMember.id, planId: plans[1].id, startDate: daysAgo(90), endDate: daysFromNow(30), isActive: true, paymentMethod: "CASH" as any },
    });
    await prisma.invoice.create({
      data: { invoiceNumber: `INV-JOHN-001`, memberId: testMember.id, memberPlanId: mp.id, description: "Premium - Monthly", amount: 250, discount: 0, tax: 0, total: 250, paymentMethod: "CASH" as any, status: "PAID" as any, dueDate: daysAgo(90), paidAt: daysAgo(88) },
    });
  }
  memberRecords.push(testMember);
  console.log(`✅ Members (${memberRecords.length})`);

  // ─── Attendance ──────────────────────────────────────────────
  const methods = ["PIN","PIN","QR_CODE","BARCODE","NAME_SEARCH","MANUAL"];
  let attendanceCount = 0;
  for (const m of memberRecords.slice(0, 30)) {
    const visits = rndInt(3, 25);
    for (let v = 0; v < visits; v++) {
      await prisma.attendance.create({
        data: {
          memberId: m.id,
          method: rnd(methods) as any,
          checkedInAt: daysAgo(rndInt(0, 90)),
        },
      });
      attendanceCount++;
    }
  }
  console.log(`✅ Attendance (${attendanceCount} check-ins)`);

  // ─── Belt Ranks ──────────────────────────────────────────────
  const rankColors = ["#f8fafc","#f97316","#eab308","#22c55e","#06b6d4","#6366f1","#7c3aed","#1e293b"];
  const rankNames = ["White Belt","Yellow Belt","Orange Belt","Green Belt","Blue Belt","Purple Belt","Brown Belt","Black Belt"];
  const createdRanks: any[] = [];
  for (let i = 0; i < rankNames.length; i++) {
    const rank = await prisma.beltRank.upsert({
      where: { id: `rank-${i}` },
      update: {},
      create: {
        id: `rank-${i}`,
        name: rankNames[i],
        color: rankColors[i],
        order: i,
        gymType: "MARTIAL_ARTS",
        sessionsRequired: i * 20,
        monthsRequired: i * 2,
        description: `Level ${i + 1} of the belt system`,
      },
    });
    createdRanks.push(rank);
  }

  // Assign ranks to some members
  for (const m of memberRecords.slice(0, 20)) {
    const rank = rnd(createdRanks.slice(0, 5));
    const existing = await prisma.memberRank.findFirst({ where: { memberId: m.id } });
    if (!existing) {
      await prisma.memberRank.create({
        data: { memberId: m.id, rankId: rank.id, awardedAt: daysAgo(rndInt(10, 200)) },
      });
    }
  }
  console.log("✅ Belt ranks (8) + member rank assignments");

  // ─── Classes ─────────────────────────────────────────────────
  const createdClasses: any[] = [];
  for (let i = 0; i < 12; i++) {
    const start = new Date(Date.now() + rndInt(-7, 14) * 86400000);
    start.setHours(rnd([6,7,8,9,10,12,17,18,19]), 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const cls = await prisma.class.create({
      data: {
        title: CLASS_TITLES[i],
        description: `A great ${CLASS_TITLES[i]} session for all levels`,
        location: rnd(["Studio A","Studio B","Main Floor","Outdoor Court","Pool Area"]),
        startTime: start,
        endTime: end,
        capacity: rndInt(10, 25),
        isActive: true,
        color: rnd(["#6366f1","#22c55e","#f97316","#06b6d4","#ec4899","#eab308"]),
      },
    });
    createdClasses.push(cls);
  }

  // Book some members into classes
  for (const m of memberRecords.slice(0, 25)) {
    const cls = rnd(createdClasses);
    try {
      await prisma.classBooking.create({ data: { classId: cls.id, memberId: m.id } });
    } catch { /* skip duplicate */ }
  }
  console.log(`✅ Classes (${createdClasses.length}) + bookings`);

  // ─── Products & POS ──────────────────────────────────────────
  const cat = await prisma.productCategory.upsert({
    where: { name: "Supplements" }, update: {}, create: { name: "Supplements" },
  });
  const cat2 = await prisma.productCategory.upsert({
    where: { name: "Accessories" }, update: {}, create: { name: "Accessories" },
  });

  const createdProducts: any[] = [];
  for (let i = 0; i < PRODUCT_NAMES.length; i++) {
    const price = rndInt(15, 200);
    const p = await prisma.product.create({
      data: {
        name: PRODUCT_NAMES[i],
        price,
        cost: Math.round(price * 0.5),
        stock: rndInt(5, 100),
        categoryId: i < 10 ? cat.id : cat2.id,
        isActive: true,
      },
    });
    createdProducts.push(p);
  }

  // Create sales
  for (let s = 0; s < 30; s++) {
    const product = rnd(createdProducts);
    const qty = rndInt(1, 3);
    const unitPrice = Number(product.price);
    const total = qty * unitPrice;
    const member = rnd(memberRecords);
    await prisma.sale.create({
      data: {
        saleNumber: `SALE-${Date.now()}-${s}`,
        memberId: member.id,
        subtotal: total, discount: 0, tax: 0, total,
        method: rnd(["CASH","CARD","BANK_TRANSFER"]) as any,
        status: "PAID",
        createdAt: daysAgo(rndInt(0, 60)),
        items: { create: [{ productId: product.id, quantity: qty, unitPrice, total: total }] },
      },
    });
  }
  console.log(`✅ Products (${createdProducts.length}) + 30 sales`);

  // ─── Leads ───────────────────────────────────────────────────
  const leadStatuses = ["INQUIRY","CONTACTED","TRIAL","NEGOTIATING","CONVERTED","LOST"];
  for (let i = 0; i < 20; i++) {
    const fn = rnd(FIRST_NAMES);
    const ln = rnd(LAST_NAMES);
    await prisma.lead.create({
      data: {
        firstName: fn, lastName: ln,
        email: `lead.${fn.toLowerCase()}${i}@email.com`,
        phone: `+233 ${rndInt(20,59)} ${rndInt(100,999)} ${rndInt(1000,9999)}`,
        source: rnd(LEAD_SOURCES),
        status: rnd(leadStatuses) as any,
        notes: rnd(["Interested in premium plan","Wants trial first","Referred by member","Called about pricing","Visited gym in person",""]),
        createdAt: daysAgo(rndInt(1, 90)),
      },
    });
  }
  console.log("✅ Leads (20)");

  // ─── Content ─────────────────────────────────────────────────
  for (let i = 0; i < CONTENT_TITLES.length; i++) {
    await prisma.contentItem.create({
      data: {
        title: CONTENT_TITLES[i],
        description: `Learn about ${CONTENT_TITLES[i].toLowerCase()} and how it can improve your fitness journey.`,
        type: rnd(CONTENT_TYPES),
        url: i % 3 === 0 ? "https://www.youtube.com/watch?v=dQw4w9WgXcQ" : null,
        isPublished: true,
      },
    });
  }
  console.log(`✅ Content (${CONTENT_TITLES.length} items)`);

  // ─── Discounts ───────────────────────────────────────────────
  const discounts = [
    { code: "WELCOME10", name: "Welcome Discount", type: "PERCENT", value: 10, usageLimit: 100 },
    { code: "FLAT50",    name: "GHS 50 Off",       type: "FIXED",   value: 50, usageLimit: 50  },
    { code: "STUDENT20", name: "Student Special",  type: "PERCENT", value: 20, usageLimit: 200 },
    { code: "REFER25",   name: "Referral Reward",  type: "PERCENT", value: 25, usageLimit: null },
    { code: "VIP30",     name: "VIP Discount",     type: "PERCENT", value: 30, usageLimit: 20, expiresAt: daysFromNow(60) },
  ];
  for (const d of discounts) {
    await prisma.discount.upsert({
      where: { code: d.code }, update: {},
      create: { code: d.code, name: d.name, type: d.type, value: d.value, usageLimit: d.usageLimit ?? null, expiresAt: (d as any).expiresAt ?? null, isActive: true },
    });
  }
  console.log("✅ Discount codes (5)");

  // ─── Referrals ───────────────────────────────────────────────
  const activeMembers = memberRecords.slice(0, 10);
  for (let i = 0; i < 8; i++) {
    const referrer = rnd(activeMembers);
    await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredEmail: `referred.person${i}@example.com`,
        referredName: `${rnd(FIRST_NAMES)} ${rnd(LAST_NAMES)}`,
        converted: rnd([true, false, false]),
        rewardAmount: 50,
        rewardGiven: false,
        createdAt: daysAgo(rndInt(5, 60)),
      },
    });
  }
  console.log("✅ Referrals (8)");

  // ─── Notifications ───────────────────────────────────────────
  const notifTypes = ["NEW_MEMBER","PAYMENT_RECEIVED","EXPIRY_REMINDER","RANK_PROMOTION"];
  for (let i = 0; i < 15; i++) {
    const m = rnd(memberRecords);
    await prisma.notification.create({
      data: {
        memberId: m.id,
        type: rnd(notifTypes) as any,
        title: rnd(["New Member Joined","Payment Received","Membership Expiring","Rank Promotion Awarded","Welcome to QYM!"]),
        message: rnd(["Your membership is active.","Payment of GHS 250 received.","Your plan expires in 7 days.","Congratulations on your new rank!","Welcome to QYM Fitness!"]),
        isRead: rnd([true, true, false]),
        createdAt: daysAgo(rndInt(0, 30)),
      },
    });
  }
  console.log("✅ Notifications (15)");

  console.log("\n🎉 Database fully seeded!\n");
  console.log("─────────────────────────────────────");
  console.log("Login credentials:");
  console.log("  Admin:  admin@qym.com   / admin123");
  console.log("  Staff:  jane.smith@qym.com / staff123");
  console.log("  Member: john@example.com / member123");
  console.log("─────────────────────────────────────");
  console.log("Discount codes: WELCOME10 · FLAT50 · STUDENT20 · REFER25 · VIP30");
  console.log("Kiosk PIN: 1234");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
