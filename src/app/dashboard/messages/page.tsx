import { prisma } from "@/lib/prisma";
import MassMessageComposer from "@/components/messages/MassMessageComposer";
import MessageHistory from "@/components/messages/MessageHistory";
import { Users, Mail } from "lucide-react";

export default async function MessagesPage() {
  const [recentMessages, memberCount, segments] = await Promise.all([
    prisma.message.findMany({
      orderBy: { sentAt: "desc" },
      include: { _count: { select: { recipients: true } } },
    }),
    prisma.member.count({ where: { status: "ACTIVE" } }),
    Promise.all([
      prisma.member.count({ where: { status: "ACTIVE" } }),
      prisma.member.count({ where: { status: "FROZEN" } }),
      prisma.invoice.groupBy({ by: ["memberId"], where: { status: { in: ["PENDING", "FAILED"] } } }).then(r => r.length),
    ]),
  ]);

  const [activeCount, frozenCount, unpaidCount] = segments;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Mass Messaging</h1>
        <p className="text-slate-500 text-sm mt-0.5">Send emails or SMS to member segments</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Members",  value: activeCount.toString(),  icon: Users, card: "bg-sky-500",  iconBg: "bg-sky-400/30" },
          { label: "Frozen",          value: frozenCount.toString(),  icon: Users, card: "bg-blue-500", iconBg: "bg-blue-400/30" },
          { label: "Unpaid Members",  value: unpaidCount.toString(),  icon: Mail,  card: "bg-red-500",  iconBg: "bg-red-400/30" },
        ].map(s => (
          <div key={s.label} className={`relative overflow-hidden rounded-2xl p-5 cursor-default shadow-sm ${s.card}`}>
            <s.icon className="absolute -right-3 -bottom-3 w-20 h-20 text-white opacity-10 pointer-events-none" strokeWidth={1} />
            <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center mb-3`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{s.label}</p>
            <p className="text-2xl font-bold text-white mt-1 leading-none">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <MassMessageComposer memberCount={memberCount} />
        <MessageHistory initial={JSON.parse(JSON.stringify(recentMessages))} />
      </div>
    </div>
  );
}
