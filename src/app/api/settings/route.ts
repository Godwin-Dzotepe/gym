import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const settings = await prisma.gymSettings.findFirst();
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  const data = {
    gymName: body.gymName || "My Gym",
    gymType: body.gymType || "FITNESS",
    address: body.address || null,
    phone: body.phone || null,
    email: body.email || null,
    currency: body.currency || "GHS",
    timezone: body.timezone || "Africa/Accra",
    enableBeltRanks: body.enableBeltRanks ?? false,
    enableReferrals: body.enableReferrals ?? true,
    enablePOS: body.enablePOS ?? true,
    enableFacilityAccess: body.enableFacilityAccess ?? false,
    enableZoom: body.enableZoom ?? false,
    portalEnabled: body.portalEnabled ?? true,
    portalAllowEditProfile: body.portalAllowEditProfile ?? true,
    portalVisitorAccess: body.portalVisitorAccess ?? false,
    portalShowPayments: body.portalShowPayments ?? true,
    portalShowMembershipCard: body.portalShowMembershipCard ?? true,
    portalAllowRemovePayment: body.portalAllowRemovePayment ?? false,
    portalAllowUpdateRank: body.portalAllowUpdateRank ?? false,
    portalShowPromotionCriteria: body.portalShowPromotionCriteria ?? false,
    taxRate: body.taxRate ? parseFloat(body.taxRate) : 0,
    lateFeeDefault: body.lateFeeDefault ? parseFloat(body.lateFeeDefault) : 0,
    lateFeeAfterDays: body.lateFeeAfterDays ? parseInt(body.lateFeeAfterDays) : 5,
    smsApiKey: body.smsApiKey || null,
    smtpHost: body.smtpHost || null,
    smtpPort: body.smtpPort ? parseInt(body.smtpPort) : null,
    smtpUser: body.smtpUser || null,
    smtpPass: body.smtpPass || null,
    kioskPin: body.kioskPin || "1234",
    expiryNotifEnabled: body.expiryNotifEnabled ?? false,
    expiryNotifDays: body.expiryNotifDays ? parseInt(body.expiryNotifDays) : 7,
    expiryNotifEmail: body.expiryNotifEmail ?? true,
    expiryNotifSms: body.expiryNotifSms ?? false,
    expiryNotifEmailTemplate: body.expiryNotifEmailTemplate || null,
    expiryNotifSmsTemplate: body.expiryNotifSmsTemplate || null,
    paymentPhone: body.paymentPhone || null,
    paymentAccountName: body.paymentAccountName || null,
    paymentAccountNumber: body.paymentAccountNumber || null,
    paymentBankName: body.paymentBankName || null,
    paymentType: body.paymentType || null,
    paymentInstructions: body.paymentInstructions || null,
  };

  const settings = await prisma.gymSettings.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });
  return NextResponse.json(settings);
}
