"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, MessageSquare, Trash2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Message = {
  id: string;
  subject: string | null;
  body: string;
  type: string;
  segment: string | null;
  sentAt: string;
  _count: { recipients: number };
};

export default function MessageHistory({ initial }: { initial: Message[] }) {
  const [messages, setMessages]       = useState<Message[]>(initial);
  const [expanded, setExpanded]       = useState<Record<string, boolean>>({});
  const [confirming, setConfirming]   = useState<string | null>(null);
  const [deleting, setDeleting]       = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res  = await fetch("/api/messages");
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    } catch { /* silent */ }
  }, []);

  // Refresh list after a new message is sent (custom event from composer)
  useEffect(() => {
    window.addEventListener("message-sent", refresh);
    return () => window.removeEventListener("message-sent", refresh);
  }, [refresh]);

  async function deleteMessage(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/messages/${id}`, { method: "DELETE" });
      setMessages(prev => prev.filter(m => m.id !== id));
    } finally {
      setDeleting(null);
      setConfirming(null);
    }
  }

  function toggleExpand(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const SEGMENT_LABELS: Record<string, string> = {
    ALL_ACTIVE:      "All Active",
    ALL_MEMBERS:     "All Members",
    FROZEN:          "Frozen",
    PENDING:         "Pending",
    UNPAID:          "Unpaid",
    EXPIRING_7D:     "Expiring 7d",
    SPECIFIC_MEMBER: "Direct",
  };

  return (
    <div className="card flex flex-col">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="section-title">Sent Messages</h2>
        <MessageSquare className="w-4 h-4 text-slate-400" />
      </div>

      <div className="divide-y divide-slate-50 overflow-y-auto max-h-[560px]">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">No messages sent yet</p>
        ) : messages.map(msg => {
          const isExpanded  = !!expanded[msg.id];
          const isLong      = msg.body.length > 120;
          const isConfirm   = confirming === msg.id;
          const isDeleting  = deleting   === msg.id;

          return (
            <div key={msg.id} className="px-5 py-3 group">

              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {msg.type === "EMAIL" && msg.subject && (
                    <p className="text-sm font-semibold text-slate-800 truncate">{msg.subject}</p>
                  )}
                  <p className={`text-sm text-slate-600 mt-0.5 whitespace-pre-wrap break-words ${!isExpanded && isLong ? "line-clamp-2" : ""}`}>
                    {msg.body}
                  </p>
                  {isLong && (
                    <button
                      onClick={() => toggleExpand(msg.id)}
                      className="mt-1 flex items-center gap-1 text-xs text-sky-500 hover:text-sky-600 transition-colors">
                      {isExpanded
                        ? <><ChevronUp className="w-3 h-3" /> Show less</>
                        : <><ChevronDown className="w-3 h-3" /> Show more</>
                      }
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`badge ${msg.type === "EMAIL" ? "badge-blue" : "badge-green"}`}>
                    {msg.type}
                  </span>

                  {/* Delete */}
                  {!isConfirm ? (
                    <button
                      onClick={() => setConfirming(msg.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        disabled={isDeleting}
                        className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors">
                        {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Delete"}
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        onClick={() => setConfirming(null)}
                        className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer row */}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Send className="w-3 h-3" /> {msg._count.recipients} recipient{msg._count.recipients !== 1 ? "s" : ""}
                </span>
                <span className="text-xs text-slate-400">{formatDate(msg.sentAt)}</span>
                {msg.segment && (
                  <span className="badge badge-gray text-[10px]">
                    {SEGMENT_LABELS[msg.segment] ?? msg.segment}
                  </span>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
