import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Plus, BookOpen, Eye, FileText, Video, Layers } from "lucide-react";
import ContentClient from "./ContentClient";

export default async function ContentPage() {
  const items = await prisma.contentItem.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { accesses: true } } },
  });

  const published = items.filter(i => i.isPublished).length;
  const totalViews = items.reduce((s, i) => s + i._count.accesses, 0);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Content Library</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage exclusive content for members</p>
        </div>
        <Link href="/dashboard/content/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Add Content
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Items",   value: items.length.toString(),     icon: Layers,   card: "bg-indigo-500 hover:bg-indigo-600",   iconBg: "bg-indigo-400/30" },
          { label: "Published",     value: published.toString(),         icon: BookOpen, card: "bg-emerald-500 hover:bg-emerald-600", iconBg: "bg-emerald-400/30" },
          { label: "Drafts",        value: (items.length - published).toString(), icon: FileText, card: "bg-yellow-500 hover:bg-yellow-600", iconBg: "bg-yellow-400/30" },
          { label: "Total Views",   value: totalViews.toString(),        icon: Eye,      card: "bg-violet-500 hover:bg-violet-600",   iconBg: "bg-violet-400/30" },
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

      <ContentClient items={items.map(i => ({
        id: i.id,
        title: i.title,
        description: i.description ?? "",
        type: i.type,
        isPublished: i.isPublished,
        accessByRank: i.accessByRank ?? "",
        views: i._count.accesses,
        createdAt: i.createdAt.toISOString(),
      }))} />
    </div>
  );
}
