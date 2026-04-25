import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@qym.com" },
    update: {},
    create: {
      email: "admin@qym.com",
      password: adminPassword,
      role: "SUPER_ADMIN",
      staff: {
        create: {
          firstName: "Super",
          lastName: "Admin",
          position: "Administrator",
          isActive: true,
        },
      },
    },
  });
  console.log("✅ Admin created:", admin.email);

  // Staff user
  const staffPassword = await bcrypt.hash("staff123", 12);
  await prisma.user.upsert({
    where: { email: "staff@qym.com" },
    update: {},
    create: {
      email: "staff@qym.com",
      password: staffPassword,
      role: "STAFF",
      staff: {
        create: {
          firstName: "Jane",
          lastName: "Smith",
          position: "Front Desk",
          isActive: true,
        },
      },
    },
  });

  // Membership Plans
  const basicPlan = await prisma.plan.upsert({
    where: { id: "plan-basic" },
    update: {},
    create: {
      id: "plan-basic",
      name: "Basic",
      description: "Access to gym floor during regular hours",
      price: 49.99,
      billingCycle: "MONTHLY",
      isActive: true,
    },
  });

  const premiumPlan = await prisma.plan.upsert({
    where: { id: "plan-premium" },
    update: {},
    create: {
      id: "plan-premium",
      name: "Premium",
      description: "Unlimited access + classes",
      price: 89.99,
      billingCycle: "MONTHLY",
      isActive: true,
    },
  });

  const vipPlan = await prisma.plan.upsert({
    where: { id: "plan-vip" },
    update: {},
    create: {
      id: "plan-vip",
      name: "VIP Annual",
      description: "Full access + personal training sessions",
      price: 799.99,
      billingCycle: "YEARLY",
      isActive: true,
    },
  });

  console.log("✅ Plans created");

  // Sample member
  const memberPassword = await bcrypt.hash("member123", 12);
  const memberUser = await prisma.user.upsert({
    where: { email: "john@example.com" },
    update: {},
    create: {
      email: "john@example.com",
      password: memberPassword,
      role: "MEMBER",
    },
  });

  const member = await prisma.member.upsert({
    where: { email: "john@example.com" },
    update: {},
    create: {
      userId: memberUser.id,
      memberNumber: "GYM-10001",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "+1 555 0100",
      status: "ACTIVE",
      pinCode: "1234",
      waiverSigned: true,
      waiverSignedAt: new Date(),
    },
  });

  // Assign plan
  const existing = await prisma.memberPlan.findFirst({ where: { memberId: member.id } });
  if (!existing) {
    await prisma.memberPlan.create({
      data: {
        memberId: member.id,
        planId: premiumPlan.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    });
  }

  console.log("✅ Sample member created");

  // Gym Settings
  await prisma.gymSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      gymName: "QYM Fitness",
      gymType: "FITNESS",
      currency: "USD",
      timezone: "America/New_York",
      enableBeltRanks: false,
      enableReferrals: true,
      enablePOS: true,
    },
  });

  console.log("✅ Gym settings created");
  console.log("\n🎉 Seed complete!");
  console.log("\nLogin credentials:");
  console.log("  Admin:  admin@qym.com / admin123");
  console.log("  Staff:  staff@qym.com / staff123");
  console.log("  Member: john@example.com / member123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
