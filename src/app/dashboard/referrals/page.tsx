import { prisma } from "@/lib/prisma";
import { Users2 } from "lucide-react";
import ReferralsManager from "./ReferralsManager";

export default async function ReferralsPage() {
  const [referrals, members] = await Promise.all([
    prisma.referral.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.member.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
  ]);

  const referrerIds = [...new Set(referrals.map(r => r.referrerId))];
  const referrers = await prisma.member.findMany({
    where: { id: { in: referrerIds } },
    select: { id: true, firstName: true, lastName: true },
  });
  const referrerMap = Object.fromEntries(referrers.map(m => [m.id, `${m.firstName} ${m.lastName}`]));

  const total = referrals.length;
  const converted = referrals.filter(r => r.converted).length;
  const pending = referrals.filter(r => !r.converted).length;
  const rewarded = referrals.filter(r => r.rewardGiven).length;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Referrals</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track member referrals and rewards</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Referrals", value: total, color: "bg-indigo-500 hover:bg-indigo-600", iconBg: "bg-indigo-400/30" },
          { label: "Converted", value: converted, color: "bg-emerald-500 hover:bg-emerald-600", iconBg: "bg-emerald-400/30" },
          { label: "Pending", value: pending, color: "bg-orange-500 hover:bg-orange-600", iconBg: "bg-orange-400/30" },
          { label: "Rewarded", value: rewarded, color: "bg-violet-500 hover:bg-violet-600", iconBg: "bg-violet-400/30" },
        ].map((s) => (
          <div key={s.label} className={`relative overflow-hidden rounded-2xl p-5 transition-colors cursor-default shadow-sm ${s.color}`}>
            <Users2 className="absolute -right-3 -bottom-3 w-20 h-20 text-white opacity-10 pointer-events-none" strokeWidth={1} />
            <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center mb-3`}>
              <Users2 className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{s.label}</p>
            <p className="text-2xl font-bold text-white mt-1 leading-none">{s.value}</p>
          </div>
        ))}
      </div>

      <ReferralsManager
        referrals={referrals.map(r => ({
          ...r,
          rewardAmount: r.rewardAmount ? Number(r.rewardAmount) : null,
          referrerName: referrerMap[r.referrerId] ?? "Unknown",
          createdAt: r.createdAt.toISOString(),
          convertedAt: r.convertedAt?.toISOString() ?? null,
        }))}
        members={members}
      />
    </div>
  );
}
