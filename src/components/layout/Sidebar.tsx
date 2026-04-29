"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, CreditCard, Calendar, ClipboardList,
  BarChart3, ShoppingCart, BookOpen, Settings, UserPlus,
  Bell, MessageSquare, Trophy, ChevronLeft, LogOut, Zap,
  Receipt, Tag, ChevronRight, Shield, Users2, Menu, X,
} from "lucide-react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Main",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Members",
    items: [
      { href: "/dashboard/members", label: "All Members", icon: Users },
      { href: "/dashboard/members/families", label: "Family Plans", icon: UserPlus },
      { href: "/dashboard/leads", label: "Leads & CRM", icon: Zap },
      { href: "/dashboard/staff", label: "Staff", icon: Shield },
    ],
  },
  {
    label: "Billing",
    items: [
      { href: "/dashboard/billing", label: "Invoices", icon: Receipt },
      { href: "/dashboard/billing/plans", label: "Plans", icon: Tag },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/dashboard/attendance", label: "Attendance", icon: ClipboardList },
      { href: "/dashboard/classes", label: "Classes", icon: Calendar },
      { href: "/dashboard/ranks", label: "Ranks & Belts", icon: Trophy },
      { href: "/dashboard/referrals", label: "Referrals", icon: Users2 },
    ],
  },
  {
    label: "Communication",
    items: [
      { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
      { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
      { href: "/dashboard/content", label: "Content", icon: BookOpen },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/dashboard/pos", label: "Point of Sale", icon: ShoppingCart },
      { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [{ href: "/dashboard/settings", label: "Settings", icon: Settings }],
  },
];

function NavLinks({ collapsed, onNav }: { collapsed?: boolean; onNav?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && <p className="sidebar-group-label">{group.label}</p>}
            {group.items.map((item) => {
              const isActive = (item as any).exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  onClick={onNav}
                  className={cn("sidebar-link", isActive && "active", collapsed && "justify-center px-2")}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-slate-800 p-2 flex-shrink-0">
        <button
          onClick={async () => { await signOut({ redirect: false }); window.location.href = "/login"; }}
          className={cn("sidebar-link w-full", collapsed && "justify-center px-2")}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen bg-slate-900 border-r border-slate-800 transition-all duration-200 flex-shrink-0 relative",
          collapsed ? "w-[60px]" : "w-[220px]"
        )}
      >
        <div className={cn(
          "flex items-center h-16 border-b border-slate-800 flex-shrink-0 px-3",
          collapsed ? "justify-center" : "gap-2.5"
        )}>
          <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden border-2 border-orange-400/70 shadow-md shadow-orange-500/20">
            <Image src="/gym-logo.png" alt="Oracle Gym" width={36} height={36} className="object-cover w-full h-full" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-sm leading-none tracking-wide">THE ORACLE</p>
              <p className="text-orange-400 text-[10px] mt-0.5 font-semibold tracking-widest uppercase">GYM</p>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[4.5rem] w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm z-10 hover:bg-slate-50 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3 h-3 text-slate-500" /> : <ChevronLeft className="w-3 h-3 text-slate-500" />}
        </button>
        <NavLinks collapsed={collapsed} />
      </aside>

      {/* ── Mobile top strip ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 z-40 gap-3">
        <button onClick={() => setMobileOpen(true)} className="text-slate-400 hover:text-white transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full overflow-hidden border border-orange-400/60 flex-shrink-0">
            <Image src="/gym-logo.png" alt="Gym" width={28} height={28} className="object-cover w-full h-full" />
          </div>
          <p className="text-white font-black text-sm tracking-wide">THE ORACLE GYM</p>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-slate-900 flex flex-col h-full">
            <div className="flex items-center justify-between h-14 px-4 border-b border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-orange-400/60">
                  <Image src="/gym-logo.png" alt="Gym" width={32} height={32} className="object-cover w-full h-full" />
                </div>
                <div>
                  <p className="text-white font-black text-xs tracking-wide leading-none">THE ORACLE</p>
                  <p className="text-orange-400 text-[9px] font-semibold tracking-widest uppercase mt-0.5">GYM</p>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <NavLinks onNav={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
