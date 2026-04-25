import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  try {
    const category = await prisma.productCategory.update({ where: { id }, data: { name: name.trim() } });
    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: "Category already exists" }, { status: 409 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.productCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
