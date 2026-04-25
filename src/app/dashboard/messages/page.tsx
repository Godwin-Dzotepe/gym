import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import MassMessageComposer from "@/components/messages/MassMessageComposer";
import { MessageSquare, Users, Mail, Send } from "lucide-react";

export default async function MessagesPage() {
  const [recentMessages, memberCount, segments] = await Promise.all([
    prisma.message.findMany({
      take: 10, orderBy: { sentAt: "desc" },
      include: { _count: { select: { recipients: true } } },
    }),
    prisma.member.count({ where: { status: "ACTIVE" } }),
    Promise.all([
      prisma.member.count({ where: { status: "ACTIVE" } }),
      prisma.member.count({ where: { status: "FROZEN" } }),
      prisma.invoice.groupBy({ by: ["memberId"], where: { status: { in: ["PENDING","FAILED"] } } }).then((r) => r.length),
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
          { label: "Active Members", value: activeCount.toString(), icon: Users, card: "bg-sky-500 hover:bg-sky-600", iconBg: "bg-sky-400/30" },
          { label: "Frozen", value: frozenCount.toString(), icon: Users, card: "bg-blue-500 hover:bg-blue-600", iconBg: "bg-blue-400/30" },
          { label: "Unpaid Members", value: unpaidCount.toString(), icon: Mail, card: "bg-red-500 hover:bg-red-600", iconBg: "bg-red-400/30" },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <MassMessageComposer memberCount={memberCount} />

        {/* Message History */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="section-title">Sent Messages</h2>
            <MessageSquare className="w-4 h-4 text-slate-400" />
          </div>
          <div className="divide-y divide-slate-50">
            {recentMessages.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No messages sent yet</p>
            ) : recentMessages.map((msg) => (
              <div key={msg.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{msg.subject ?? "No subject"}</p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{msg.body}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`badge ${msg.type === "EMAIL" ? "badge-blue" : "badge-green"}`}>
                      {msg.type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Send className="w-3 h-3" /> {msg._count.recipients} recipients
                  </span>
                  <span className="text-xs text-slate-400">{formatDate(msg.sentAt)}</span>
                  {msg.segment && <span className="badge badge-gray text-[10px]">{msg.segment}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
