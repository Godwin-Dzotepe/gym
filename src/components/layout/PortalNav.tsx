"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard, CreditCard, ClipboardList,
  Calendar, Trophy, User, LogOut, Dumbbell, Menu, X,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useState } from "react";
import Image from "next/image";

const links = [
  { href: "/portal",            label: "Overview",   icon: LayoutDashboard },
  { href: "/portal/payments",   label: "Payments",   icon: CreditCard },
  { href: "/portal/attendance", label: "Attendance", icon: ClipboardList },
  { href: "/portal/classes",    label: "Classes",    icon: Calendar },
  { href: "/portal/progress",   label: "Progress",   icon: Trophy },
  { href: "/portal/profile",    label: "Profile",    icon: User },
];

export default function PortalNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user?.firstName && user?.lastName
    ? getInitials(user.firstName, user.lastName)
    : "M";

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex flex-col fixed top-0 left-0 h-full w-56 bg-gray-900 border-r border-white/5 z-30">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-800 border border-orange-400/40 flex-shrink-0">
            <Image src="/gym-logo.png" alt="Gym" width={36} height={36} className="object-cover w-full h-full" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-black text-sm tracking-wide leading-none">Member</p>
            <p className="text-orange-400 text-[10px] font-semibold tracking-widest uppercase mt-0.5">Portal</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {links.map((l) => {
            const active = l.href === "/portal" ? pathname === "/portal" : pathname.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-orange-500/15 text-orange-400"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}>
                <l.icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-orange-400" : "")} />
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5">
            <div className="w-8 h-8 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
            </div>
            <button onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign out"
              className="text-gray-500 hover:text-white transition-colors flex-shrink-0">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile topbar ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-gray-900 border-b border-white/5 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-800 border border-orange-400/40">
            <Image src="/gym-logo.png" alt="Gym" width={32} height={32} className="object-cover w-full h-full" />
          </div>
          <span className="text-white font-black text-sm tracking-wide">Member Portal</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)}
          className="text-gray-400 hover:text-white transition-colors">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-20 flex" onClick={() => setMobileOpen(false)}>
          <div className="fixed top-14 left-0 right-0 bottom-0 bg-black/50" />
          <div className="fixed top-14 left-0 right-0 bg-gray-900 border-b border-white/10 p-3 space-y-1"
            onClick={e => e.stopPropagation()}>
            {links.map((l) => {
              const active = l.href === "/portal" ? pathname === "/portal" : pathname.startsWith(l.href);
              return (
                <Link key={l.href} href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    active ? "bg-orange-500/15 text-orange-400" : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}>
                  <l.icon className="w-4 h-4 flex-shrink-0" />
                  {l.label}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-white/10">
              <button onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-3 px-4 py-3 w-full text-sm text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-all">
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
