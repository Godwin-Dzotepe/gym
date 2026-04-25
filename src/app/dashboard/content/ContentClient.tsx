"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Video, FileText, Eye, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";

interface ContentItem {
  id: string; title: string; description: string; type: string;
  isPublished: boolean; accessByRank: string; views: number; createdAt: string;
}

const TYPE_CONFIG: Record<string, { icon: any; bg: string; text: string; label: string }> = {
  VIDEO:    { icon: Video,    bg: "bg-blue-100",   text: "text-blue-600",   label: "Video"    },
  DOCUMENT: { icon: FileText, bg: "bg-gray-100",   text: "text-gray-600",   label: "Document" },
  ARTICLE:  { icon: BookOpen, bg: "bg-purple-100", text: "text-purple-600", label: "Article"  },
};

export default function ContentClient({ items: initial }: { items: ContentItem[] }) {
  const router  = useRouter();
  const toast   = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState(initial);

  async function deleteItem(item: ContentItem) {
    const ok = await confirm({
      title: "Delete Content?",
      message: `"${item.title}" will be permanently deleted.`,
      confirmLabel: "Delete", danger: true,
    });
    if (!ok) return;
    await fetch(`/api/content/${item.id}`, { method: "DELETE" });
    setItems(prev => prev.filter(i => i.id !== item.id));
    toast.success("Content deleted.");
    router.refresh();
  }

  async function togglePublish(item: ContentItem) {
    const res = await fetch(`/api/content/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !item.isPublished }),
    });
    if (!res.ok) { toast.error("Failed to update."); return; }
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, isPublished: !i.isPublished } : i));
    toast.success(item.isPublished ? "Moved to drafts." : "Published successfully.");
  }

  if (items.length === 0) {
    return (
      <div className="card">
        <div className="py-16 text-center">
          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-indigo-500" />
          </div>
          <p className="font-semibold text-gray-800 mb-1">No content yet</p>
          <p className="text-sm text-gray-400 mb-5">Upload workout guides, videos, and documents for your members</p>
          <Link href="/dashboard/content/new" className="btn-primary text-sm">Add First Content</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => {
        const tc = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.ARTICLE;
        const Icon = tc.icon;
        return (
          <div key={item.id} className="card overflow-hidden hover:shadow-md transition-shadow group">
            {/* Type color bar */}
            <div className={`h-1 w-full ${
              item.type === "VIDEO" ? "bg-blue-500" :
              item.type === "DOCUMENT" ? "bg-gray-400" : "bg-purple-500"
            }`} />

            <div className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-11 h-11 ${tc.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${tc.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mb-4">
                <span className={`badge text-[10px] ${
                  item.type === "VIDEO" ? "badge-blue" :
                  item.type === "DOCUMENT" ? "badge-gray" : "badge-purple"
                }`}>{tc.label}</span>
                {item.isPublished
                  ? <span className="badge badge-green text-[10px]">Published</span>
                  : <span className="badge badge-yellow text-[10px]">Draft</span>
                }
                {item.accessByRank && (
                  <span className="badge badge-purple text-[10px]">Rank: {item.accessByRank}</span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {item.views} views
                </span>
                <span>{formatDate(item.createdAt)}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 border-t border-gray-50 pt-3">
                <button
                  onClick={() => togglePublish(item)}
                  className={`flex-1 text-xs py-1.5 rounded-lg font-medium border transition-colors ${
                    item.isPublished
                      ? "border-yellow-200 text-yellow-600 hover:bg-yellow-50"
                      : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  }`}
                >
                  {item.isPublished ? "Unpublish" : "Publish"}
                </button>
                <Link href={`/dashboard/content/${item.id}/edit`}
                  className="w-8 h-8 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => deleteItem(item)}
                  className="w-8 h-8 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
