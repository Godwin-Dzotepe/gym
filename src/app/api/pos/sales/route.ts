import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const LOW_STOCK_THRESHOLD = 5;

export async function GET(req: NextRequest) {
  const sales = await prisma.sale.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      member: { select: { firstName: true, lastName: true } },
      staff: { select: { firstName: true, lastName: true } },
      items: { include: { product: { select: { name: true } } } },
    },
  });
  return NextResponse.json({ sales });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { items, method, memberId, customerName, subtotal, tax = 0, total, transactionId, sendReceipt, notes, discountCode } = body;

  const saleItems = items.map((item: any) => ({
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discount: item.discount ?? 0,
    total: (item.unitPrice - (item.discount ?? 0)) * item.quantity,
  }));

  const sale = await prisma.sale.create({
    data: {
      saleNumber: `SALE-${Date.now()}`,
      memberId: memberId ?? null,
      customerName: customerName ?? null,
      subtotal: subtotal ?? total,
      discount: 0,
      discountCode: discountCode ?? null,
      tax: tax ?? 0,
      total,
      method: (method ?? "CASH") as any,
      transactionId: transactionId ?? null,
      sendReceipt: sendReceipt ?? false,
      notes: notes ?? null,
      status: "PAID",
      items: { create: saleItems },
    },
  });

  // Decrement stock and fire low-stock notifications
  for (const item of items) {
    const updated = await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    }).catch(() => null);

    if (updated && updated.stock <= LOW_STOCK_THRESHOLD) {
      // Avoid duplicate low-stock notifications — only if no unread one exists today
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const existing = await prisma.notification.findFirst({
        where: { type: "SYSTEM", title: { contains: updated.name }, createdAt: { gte: today } },
      });
      if (!existing) {
        await prisma.notification.create({
          data: {
            type: "SYSTEM",
            title: `Low Stock: ${updated.name}`,
            message: `${updated.name} is running low — only ${updated.stock} unit${updated.stock === 1 ? "" : "s"} remaining. Please restock soon.`,
            link: `/dashboard/pos?tab=products`,
          },
        });
      }
    }
  }

  return NextResponse.json(sale, { status: 201 });
}
