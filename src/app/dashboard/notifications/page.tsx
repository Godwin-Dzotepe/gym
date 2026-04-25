import { prisma } from "@/lib/prisma";
import { formatRelativeTime } from "@/lib/utils";
import { Bell, AlertTriangle, CheckCircle2, Info, UserPlus, CreditCard, Trophy } from "lucide-react";
import MarkAllReadButton from "@/components/notifications/MarkAllReadButton";

export default async function NotificationsPage() {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { member: { select: { firstName: true, lastName: true } } },
  });

  const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
    FAILED_PAYMENT:       { icon: AlertTriangle,  color: "text-red-500",    bg: "bg-red-50" },
    EXPIRING_MEMBERSHIP:  { icon: AlertTriangle,  color: "text-yellow-500", bg: "bg-yellow-50" },
    NEW_MEMBER:           { icon: UserPlus,       color: "text-sky-500",    bg: "bg-sky-50" },
    NEW_LEAD:             { icon: UserPlus,       color: "text-violet-500", bg: "bg-violet-50" },
    ATTENDANCE_MILESTONE: { icon: CheckCircle2,   color: "text-emerald-500",bg: "bg-emerald-50" },
    RANK_PROMOTION:       { icon: Trophy,         color: "text-yellow-500", bg: "bg-yellow-50" },
    EXPIRY_REMINDER:      { icon: CreditCard,     color: "text-orange-500", bg: "bg-orange-50" },
    PAYMENT_RECEIVED:     { icon: CheckCircle2,   color: "text-emerald-500",bg: "bg-emerald-50" },
    SYSTEM:               { icon: Info,           color: "text-slate-500",  bg: "bg-slate-50" },
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {unread > 0 ? `${unread} unread notification${unread > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {unread > 0 && <MarkAllReadButton />}
      </div>

      <div className="card divide-y divide-slate-50">
        {notifications.length === 0 ? (
          <div className="empty-state py-16">
            <div className="empty-state-icon"><Bell className="w-6 h-6" /></div>
            <p className="empty-state-title">No notifications</p>
            <p className="empty-state-desc">System alerts and updates will appear here</p>
          </div>
        ) : notifications.map((n) => {
          const cfg = typeConfig[n.type] ?? typeConfig.SYSTEM;
          const Icon = cfg.icon;
          return (
            <div key={n.id} className={`flex items-start gap-3 px-5 py-4 hover:bg-slate-50 transition-colors ${!n.isRead ? "bg-sky-50/30" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                <Icon className={`w-4 h-4 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${n.isRead ? "text-slate-700" : "text-slate-900"}`}>
                  {n.title}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                {n.member && (
                  <p className="text-xs text-sky-600 mt-0.5">
                    {n.member.firstName} {n.member.lastName}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!n.isRead && <div className="w-2 h-2 bg-sky-500 rounded-full" />}
                <span className="text-xs text-slate-400">{formatRelativeTime(n.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
