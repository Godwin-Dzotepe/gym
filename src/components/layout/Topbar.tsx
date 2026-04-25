"use client";

import { Bell, Search, ChevronDown, ExternalLink, Plus, CheckCheck } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { getInitials, formatRelativeTime } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

interface Notification { id: string; title: string; message: string; link: string | null; isRead: boolean; createdAt: string; }

export default function Topbar() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [showProfile, setShowProfile] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    fetch("/api/notifications").then(r => r.json()).then(d => {
      setNotifications(d.notifications ?? []);
      setUnreadCount(d.unreadCount ?? 0);
    });
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setNotifications(n => n.map(x => ({ ...x, isRead: true })));
    setUnreadCount(0);
  }

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x));
    setUnreadCount(c => Math.max(0, c - 1));
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-5 gap-4 flex-shrink-0 z-10">
      {/* Search */}
      <div className="flex-1 max-w-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search members..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        {/* Quick actions */}
        <Link href="/dashboard/members/new"
          className="btn-primary text-xs py-1.5 px-3 hidden sm:inline-flex">
          <Plus className="w-3.5 h-3.5" /> Add Member
        </Link>

        <Link href="/kiosk" target="_blank"
          className="btn-ghost text-xs py-1.5 px-3 hidden sm:inline-flex border border-slate-200">
          <ExternalLink className="w-3.5 h-3.5" /> Kiosk
        </Link>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button onClick={() => setShowNotif(v => !v)} className="btn-icon relative">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 rounded-full ring-1 ring-white text-[10px] text-white font-bold flex items-center justify-center px-0.5">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-10 w-[calc(100vw-1rem)] max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No notifications</p>
                ) : notifications.map(n => (
                  <div key={n.id} onClick={() => !n.isRead && markRead(n.id)}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${!n.isRead ? "bg-indigo-50/50" : ""}`}>
                    {n.link ? (
                      <Link href={n.link} onClick={() => setShowNotif(false)}>
                        <p className={`text-sm ${!n.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
                      </Link>
                    ) : (
                      <>
                        <p className={`text-sm ${!n.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
                      </>
                    )}
                    {!n.isRead && <span className="w-2 h-2 bg-indigo-500 rounded-full inline-block mt-1" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 pl-3 ml-1 border-l border-slate-200 hover:bg-slate-50 rounded-lg p-1.5 transition-colors"
          >
            <div className="avatar avatar-sm">
              {user?.firstName && user?.lastName
                ? getInitials(user.firstName, user.lastName)
                : "A"}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold text-slate-800 leading-none">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 capitalize leading-none">
                {user?.role?.toLowerCase().replace("_", " ")}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfile && (
            <div className="dropdown-menu right-0 top-12 w-52">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-semibold text-slate-800">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <Link href="/dashboard/settings" className="dropdown-item">
                Settings
              </Link>
              <div className="dropdown-divider" />
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="dropdown-item dropdown-item-danger w-full">
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
