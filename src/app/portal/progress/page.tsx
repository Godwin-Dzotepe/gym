import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Trophy, Target } from "lucide-react";

export default async function PortalProgressPage() {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId;

  const [member, allRanks] = await Promise.all([
    prisma.member.findUnique({
      where: { id: memberId },
      include: {
        beltRanks: { include: { rank: true }, orderBy: { awardedAt: "desc" } },
        _count: { select: { attendances: true } },
      },
    }),
    prisma.beltRank.findMany({ orderBy: { order: "asc" } }),
  ]);

  const currentRank = member?.beltRanks[0]?.rank;
  const currentRankIndex = allRanks.findIndex((r) => r.id === currentRank?.id);
  const nextRank = allRanks[currentRankIndex + 1];
  const sessionsAttended = member?._count.attendances ?? 0;
  const progressPct = nextRank?.sessionsRequired
    ? Math.min(100, Math.round((sessionsAttended / nextRank.sessionsRequired) * 100))
    : 0;

  return (
    <div className="space-y-5">
      <h1 className="page-title">My Progress</h1>

      {allRanks.length === 0 ? (
        <div className="card p-10 text-center">
          <Trophy className="w-8 h-8 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">Rank tracking is not enabled for your gym type.</p>
        </div>
      ) : (
        <>
          {/* Current Rank */}
          <div className="card p-6">
            <div className="flex items-center gap-4">
              {currentRank?.color && (
                <div className="w-16 h-16 rounded-full border-4 border-slate-100 flex-shrink-0"
                  style={{ backgroundColor: currentRank.color }} />
              )}
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Current Rank</p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">
                  {currentRank?.name ?? "No Rank Yet"}
                </p>
                <p className="text-sm text-slate-500 mt-0.5">{sessionsAttended} total sessions attended</p>
              </div>
            </div>

            {nextRank && (
              <div className="mt-5 pt-5 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-sky-500" />
                    <span className="text-sm font-medium text-slate-700">Progress to {nextRank.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-sky-600">{progressPct}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill bg-sky-500" style={{ width: `${progressPct}%` }} />
                </div>
                {nextRank.sessionsRequired && (
                  <p className="text-xs text-slate-400 mt-1.5">
                    {sessionsAttended} / {nextRank.sessionsRequired} sessions
                    {nextRank.sessionsRequired - sessionsAttended > 0
                      ? ` · ${nextRank.sessionsRequired - sessionsAttended} more needed`
                      : " · Ready for promotion!"}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Rank Journey */}
          <div className="card p-5">
            <h2 className="section-title mb-4">Rank Journey</h2>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {allRanks.map((rank, i) => {
                const earned = member?.beltRanks.some((br) => br.rankId === rank.id);
                const isCurrent = rank.id === currentRank?.id;
                return (
                  <div key={rank.id} className="flex items-center gap-2 flex-shrink-0">
                    <div className={`flex flex-col items-center gap-1 ${earned ? "opacity-100" : "opacity-30"}`}>
                      <div className={`w-8 h-8 rounded-full border-2 ${isCurrent ? "border-sky-500 ring-2 ring-sky-200" : "border-slate-200"}`}
                        style={{ backgroundColor: rank.color ?? "#e2e8f0" }} />
                      <span className="text-[10px] text-slate-500 text-center max-w-12 leading-tight">{rank.name}</span>
                    </div>
                    {i < allRanks.length - 1 && (
                      <div className={`w-8 h-0.5 flex-shrink-0 ${earned ? "bg-sky-300" : "bg-slate-200"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* History */}
          {member?.beltRanks && member.beltRanks.length > 0 && (
            <div className="card p-5">
              <h2 className="section-title mb-4">Promotion History</h2>
              <div className="space-y-3">
                {member.beltRanks.map((br) => (
                  <div key={br.id} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: br.rank.color ?? "#e2e8f0" }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{br.rank.name}</p>
                    </div>
                    <span className="text-xs text-slate-400">{formatDate(br.awardedAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
