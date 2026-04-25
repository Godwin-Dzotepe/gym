import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: fetch published content with member's progress
export async function GET() {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId;
  if (!memberId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [items, accesses] = await Promise.all([
    prisma.contentItem.findMany({ where: { isPublished: true }, orderBy: { createdAt: "desc" } }),
    prisma.contentAccess.findMany({ where: { memberId } }),
  ]);

  const accessMap = Object.fromEntries(accesses.map(a => [a.contentId, a]));

  return NextResponse.json(items.map(i => ({
    id: i.id,
    title: i.title,
    description: i.description,
    type: i.type,
    url: i.url,
    thumbnail: i.thumbnail,
    accessed: !!accessMap[i.id],
    completed: accessMap[i.id]?.completed ?? false,
    completedAt: accessMap[i.id]?.completedAt ?? null,
  })));
}

// POST: log access or mark complete
export async function POST(req: NextRequest) {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId;
  if (!memberId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contentId, complete } = await req.json();
  if (!contentId) return NextResponse.json({ error: "contentId required" }, { status: 400 });

  const access = await prisma.contentAccess.upsert({
    where: { contentId_memberId: { contentId, memberId } },
    create: {
      contentId, memberId,
      completed: complete === true,
      completedAt: complete === true ? new Date() : null,
    },
    update: {
      ...(complete === true ? { completed: true, completedAt: new Date() } : {}),
    },
  });

  return NextResponse.json(access);
}
