import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { name, description, price, stock, category } = body;
  if (!name || price === undefined) return NextResponse.json({ error: "name and price required" }, { status: 400 });

  const product = await prisma.product.create({
    data: {
      name, description, category,
      price: Number(price),
      stock: Number(stock ?? 0),
      isActive: true,
    },
  });
  return NextResponse.json(product, { status: 201 });
}
