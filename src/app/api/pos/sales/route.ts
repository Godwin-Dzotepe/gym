import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  const { items, method, memberId, subtotal, tax = 0, total, transactionId, sendReceipt, notes, discountCode } = body;

  const saleItems = items.map((item: any) => ({
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discount: item.discount ?? 0,
    total: (item.unitPrice - (item.discount ?? 0)) * item.quantity,
  }));

  const saleNumber = `SALE-${Date.now()}`;

  const sale = await prisma.sale.create({
    data: {
      saleNumber,
      memberId: memberId ?? null,
      subtotal: subtotal ?? total,
      discount: 0,
      discountCode: discountCode ?? null,
      tax: tax ?? 0,
      total,
      method: method ?? "CASH",
      transactionId: transactionId ?? null,
      sendReceipt: sendReceipt ?? false,
      notes: notes ?? null,
      status: "PAID",
      items: { create: saleItems },
    },
  });

  // Update stock
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    }).catch(() => {}); // ignore if stock goes negative
  }

  return NextResponse.json(sale, { status: 201 });
}
