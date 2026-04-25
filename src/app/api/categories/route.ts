import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.productCategory.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  try {
    const category = await prisma.productCategory.create({ data: { name: name.trim() } });
    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Category already exists" }, { status: 409 });
  }
}
