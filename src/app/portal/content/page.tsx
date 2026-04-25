import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PortalContentClient from "./PortalContentClient";

export default async function PortalContentPage() {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId;
  if (!memberId) return <div className="text-center py-20 text-gray-400">Please log in to view content.</div>;

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: {
      beltRanks: { include: { rank: true }, orderBy: { awardedAt: "desc" }, take: 1 },
      memberPlans: { where: { isActive: true }, select: { planId: true }, take: 1 },
    },
  });

  const memberRankId = member?.beltRanks[0]?.rank?.id ?? null;
  const memberPlanId = member?.memberPlans[0]?.planId ?? null;

  const [allItems, accesses] = await Promise.all([
    prisma.contentItem.findMany({ where: { isPublished: true }, orderBy: { createdAt: "desc" } }),
    prisma.contentAccess.findMany({ where: { memberId } }),
  ]);

  // Enforce access restrictions — if accessByRank or accessByPlan is set, member must match
  const items = allItems.filter(i => {
    if (i.accessByRank && i.accessByRank !== memberRankId) return false;
    if (i.accessByPlan && i.accessByPlan !== memberPlanId) return false;
    return true;
  });

  const accessMap = Object.fromEntries(accesses.map(a => [a.contentId, a]));

  return (
    <PortalContentClient
      items={items.map(i => ({
        id: i.id,
        title: i.title,
        description: i.description ?? "",
        type: i.type,
        url: i.url ?? "",
        thumbnail: i.thumbnail ?? "",
        accessed: !!accessMap[i.id],
        completed: (accessMap[i.id] as any)?.completed ?? false,
      }))}
    />
  );
}
