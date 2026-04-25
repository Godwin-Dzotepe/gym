import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Trophy, Users, Star, TrendingUp } from "lucide-react";
import RanksManager from "./RanksManager";

export default async function RanksPage() {
  const [ranks, recentPromotions, members] = await Promise.all([
    prisma.beltRank.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { memberRanks: true } } },
    }),
    prisma.memberRank.findMany({
      take: 20, orderBy: { awardedAt: "desc" },
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
        rank: true,
      },
    }),
    prisma.member.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true, firstName: true, lastName: true, memberNumber: true,
        createdAt: true,
        _count: { select: { attendances: true } },
        beltRanks: { include: { rank: true }, orderBy: { awardedAt: "desc" }, take: 1 },
      },
      orderBy: { firstName: "asc" },
    }),
  ]);

  // Build promotion suggestions: members who meet the next rank's requirements but haven't been promoted yet
  const sortedRanks = [...ranks].sort((a, b) => a.order - b.order);
  const suggestions: { memberId: string; memberName: string; memberNumber: string; currentRankName: string | null; nextRankId: string; nextRankName: string; nextRankColor: string; sessionsHave: number; sessionsNeed: number | null; monthsHave: number; monthsNeed: number | null; }[] = [];

  for (const m of members) {
    const currentRankOrder = m.beltRanks[0]?.rank?.order ?? -1;
    const nextRank = sortedRanks.find(r => r.order > currentRankOrder);
    if (!nextRank) continue;

    const sessionsHave = m._count.attendances;
    const monthsHave = Math.floor((Date.now() - m.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const meetsSession = nextRank.sessionsRequired === null || sessionsHave >= nextRank.sessionsRequired;
    const meetsMonths  = nextRank.monthsRequired  === null || monthsHave  >= nextRank.monthsRequired;

    if (meetsSession && meetsMonths) {
      suggestions.push({
        memberId:       m.id,
        memberName:     `${m.firstName} ${m.lastName}`,
        memberNumber:   m.memberNumber,
        currentRankName: m.beltRanks[0]?.rank?.name ?? null,
        nextRankId:     nextRank.id,
        nextRankName:   nextRank.name,
        nextRankColor:  nextRank.color ?? "#e2e8f0",
        sessionsHave,
        sessionsNeed:   nextRank.sessionsRequired,
        monthsHave,
        monthsNeed:     nextRank.monthsRequired,
      });
    }
  }

  const totalPromotions = await prisma.memberRank.count();

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ranks & Belt System</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage belt ranks and member promotions</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Ranks",      value: ranks.length.toString(),          icon: Trophy,     card: "bg-yellow-500 hover:bg-yellow-600",  iconBg: "bg-yellow-400/30" },
          { label: "Total Promotions", value: totalPromotions.toString(),        icon: TrendingUp, card: "bg-emerald-500 hover:bg-emerald-600", iconBg: "bg-emerald-400/30" },
          { label: "This Month",       value: recentPromotions.filter(p => new Date(p.awardedAt) > new Date(Date.now() - 30*24*60*60*1000)).length.toString(), icon: Star, card: "bg-orange-500 hover:bg-orange-600", iconBg: "bg-orange-400/30" },
          { label: "Active Members",   value: members.length.toString(),         icon: Users,      card: "bg-violet-500 hover:bg-violet-600",   iconBg: "bg-violet-400/30" },
        ].map((s) => (
          <div key={s.label} className={`relative overflow-hidden rounded-2xl p-5 transition-colors cursor-default shadow-sm ${s.card}`}>
            <s.icon className="absolute -right-3 -bottom-3 w-20 h-20 text-white opacity-10 pointer-events-none" strokeWidth={1} />
            <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center mb-3`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{s.label}</p>
            <p className="text-2xl font-bold text-white mt-1 leading-none">{s.value}</p>
          </div>
        ))}
      </div>

      <RanksManager
        ranks={ranks.map(r => ({ ...r, memberCount: r._count.memberRanks }))}
        promotions={recentPromotions.map(p => ({
          id: p.id, awardedAt: p.awardedAt.toISOString(), notes: p.notes ?? "",
          memberName: `${p.member.firstName} ${p.member.lastName}`,
          memberId: p.member.id,
          rankName: p.rank.name, rankColor: p.rank.color ?? "#e2e8f0",
        }))}
        members={members.map(m => ({
          id: m.id,
          name: `${m.firstName} ${m.lastName}`,
          memberNumber: m.memberNumber,
          currentRank: m.beltRanks[0]?.rank ? { name: m.beltRanks[0].rank.name, color: m.beltRanks[0].rank.color ?? "#e2e8f0" } : null,
        }))}
        suggestions={suggestions}
      />
    </div>
  );
}
