"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Play, FileText, Link as LinkIcon, BookOpen, Loader2 } from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: string;
  url: string;
  thumbnail: string;
  accessed: boolean;
  completed: boolean;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  VIDEO:    <Play className="w-4 h-4" />,
  PDF:      <FileText className="w-4 h-4" />,
  LINK:     <LinkIcon className="w-4 h-4" />,
  ARTICLE:  <BookOpen className="w-4 h-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  VIDEO:   "bg-red-100 text-red-600",
  PDF:     "bg-orange-100 text-orange-600",
  LINK:    "bg-blue-100 text-blue-600",
  ARTICLE: "bg-purple-100 text-purple-600",
};

export default function PortalContentClient({ items }: { items: ContentItem[] }) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    () => new Set(items.filter(i => i.completed).map(i => i.id))
  );
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<ContentItem | null>(null);

  const completedCount = completedIds.size;
  const totalCount = items.length;

  async function markComplete(item: ContentItem) {
    if (completedIds.has(item.id)) return;
    setMarkingId(item.id);
    await fetch("/api/portal/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId: item.id, complete: true }),
    });
    setCompletedIds(prev => new Set([...prev, item.id]));
    setMarkingId(null);
  }

  async function openItem(item: ContentItem) {
    setSelected(item);
    // Log access (no completion yet)
    fetch("/api/portal/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId: item.id, complete: false }),
    });
  }

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-800">Your Progress</p>
            <p className="text-sm font-bold text-indigo-600">{completedCount} / {totalCount} completed</p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : "0%" }}
            />
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No content available for your membership.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => {
            const done = completedIds.has(item.id);
            return (
              <div key={item.id} className={`card overflow-hidden flex flex-col transition-shadow hover:shadow-md ${done ? "ring-2 ring-emerald-200" : ""}`}>
                {/* Thumbnail or type banner */}
                {item.thumbnail ? (
                  <div className="h-36 bg-gray-100 overflow-hidden">
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`h-24 flex items-center justify-center text-3xl ${TYPE_COLORS[item.type] ?? "bg-gray-100 text-gray-400"}`}>
                    {TYPE_ICONS[item.type] ?? <BookOpen className="w-8 h-8" />}
                  </div>
                )}

                <div className="p-4 flex flex-col flex-1 gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">{item.title}</p>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${TYPE_COLORS[item.type] ?? "bg-gray-100 text-gray-500"}`}>
                      {item.type}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                  )}

                  <div className="mt-auto pt-3 border-t border-gray-50 flex gap-2">
                    <button
                      onClick={() => openItem(item)}
                      className="btn-primary flex-1 justify-center text-xs py-2"
                    >
                      {TYPE_ICONS[item.type]} View
                    </button>
                    <button
                      onClick={() => markComplete(item)}
                      disabled={done || markingId === item.id}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                        done
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default"
                          : "bg-white text-gray-500 border-gray-200 hover:border-emerald-300 hover:text-emerald-600"
                      }`}
                      title={done ? "Completed" : "Mark as complete"}
                    >
                      {markingId === item.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : done
                        ? <CheckCircle2 className="w-3.5 h-3.5" />
                        : <Circle className="w-3.5 h-3.5" />}
                      {done ? "Done" : "Mark done"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Content viewer modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="font-semibold text-gray-900">{selected.title}</p>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${TYPE_COLORS[selected.type] ?? "bg-gray-100 text-gray-500"}`}>
                  {selected.type}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-4">
              {selected.description && (
                <p className="text-sm text-gray-600">{selected.description}</p>
              )}

              {selected.type === "VIDEO" && selected.url && (
                <div className="aspect-video rounded-xl overflow-hidden bg-black">
                  {selected.url.includes("youtube.com") || selected.url.includes("youtu.be") ? (
                    <iframe
                      className="w-full h-full"
                      src={selected.url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video controls className="w-full h-full">
                      <source src={selected.url} />
                    </video>
                  )}
                </div>
              )}

              {selected.type === "PDF" && selected.url && (
                <div className="aspect-[4/5] rounded-xl overflow-hidden border border-gray-200">
                  <iframe src={selected.url} className="w-full h-full" title={selected.title} />
                </div>
              )}

              {(selected.type === "LINK" || selected.type === "ARTICLE") && selected.url && (
                <a href={selected.url} target="_blank" rel="noopener noreferrer"
                  className="btn-primary inline-flex">
                  <LinkIcon className="w-4 h-4" /> Open {selected.type === "LINK" ? "Link" : "Article"}
                </a>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={completedIds.has(selected.id)}
                  onChange={() => markComplete(selected)}
                  disabled={completedIds.has(selected.id) || markingId === selected.id}
                  className="w-4 h-4 accent-emerald-500"
                />
                <span className="text-sm text-gray-700">I've reviewed this content</span>
              </label>
              {completedIds.has(selected.id) && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" /> Completed
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
