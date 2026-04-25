import Link from "next/link";
import { LucideIcon, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  color: "sky" | "emerald" | "violet" | "orange" | "yellow" | "blue" | "red" | "slate";
  trend?: string;
  trendDir?: "up" | "down" | "neutral";
  href?: string;
  // legacy — ignored now
  iconColor?: string;
  iconBg?: string;
}

const COLORS = {
  sky:     { card: "bg-sky-500     hover:bg-sky-600",     icon: "bg-sky-400/40",     text: "text-white", sub: "text-sky-100",  trend: "text-sky-200",  border: "border-sky-400/30" },
  emerald: { card: "bg-emerald-500 hover:bg-emerald-600", icon: "bg-emerald-400/40", text: "text-white", sub: "text-emerald-100", trend: "text-emerald-200", border: "border-emerald-400/30" },
  violet:  { card: "bg-violet-500  hover:bg-violet-600",  icon: "bg-violet-400/40",  text: "text-white", sub: "text-violet-100", trend: "text-violet-200", border: "border-violet-400/30" },
  orange:  { card: "bg-orange-500  hover:bg-orange-600",  icon: "bg-orange-400/40",  text: "text-white", sub: "text-orange-100", trend: "text-orange-200", border: "border-orange-400/30" },
  yellow:  { card: "bg-yellow-400  hover:bg-yellow-500",  icon: "bg-yellow-300/40",  text: "text-yellow-900", sub: "text-yellow-800", trend: "text-yellow-700", border: "border-yellow-300/40" },
  blue:    { card: "bg-blue-500    hover:bg-blue-600",    icon: "bg-blue-400/40",    text: "text-white", sub: "text-blue-100",  trend: "text-blue-200",  border: "border-blue-400/30" },
  red:     { card: "bg-red-500     hover:bg-red-600",     icon: "bg-red-400/40",     text: "text-white", sub: "text-red-100",   trend: "text-red-200",   border: "border-red-400/30" },
  slate:   { card: "bg-slate-500   hover:bg-slate-600",   icon: "bg-slate-400/40",   text: "text-white", sub: "text-slate-100", trend: "text-slate-300",  border: "border-slate-400/30" },
};

export default function StatCard({
  title, value, subtitle, icon: Icon,
  color = "sky", trend, trendDir = "neutral", href,
}: Props) {
  const c = COLORS[color];

  const content = (
    <div className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-colors duration-150 cursor-pointer shadow-sm ${c.card}`}>
      {/* Ghost background icon */}
      <Icon className={`absolute -right-3 -bottom-3 w-16 sm:w-24 h-16 sm:h-24 opacity-[0.12] pointer-events-none text-white`} strokeWidth={1} />

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${c.sub}`}>{title}</p>
          <p className={`text-xl sm:text-3xl font-bold mt-1 sm:mt-1.5 leading-none truncate ${c.text}`}>{value}</p>
          {subtitle && <p className={`text-xs mt-1 sm:mt-1.5 ${c.sub}`}>{subtitle}</p>}
        </div>
        <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl ${c.icon} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${c.text}`} />
        </div>
      </div>

      {trend && (
        <div className={`mt-4 pt-3 border-t ${c.border} flex items-center justify-between`}>
          <div className="flex items-center gap-1.5">
            {trendDir === "up"   && <TrendingUp   className={`w-3.5 h-3.5 ${c.trend}`} />}
            {trendDir === "down" && <TrendingDown  className={`w-3.5 h-3.5 ${c.trend}`} />}
            <span className={`text-xs font-medium ${c.trend}`}>{trend}</span>
          </div>
          {href && <ArrowRight className={`w-3.5 h-3.5 ${c.trend}`} />}
        </div>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
