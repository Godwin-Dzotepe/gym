"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MessageCircle, PhoneCall, Dumbbell, Handshake, CheckCircle2,
  Pencil, Trash2, X, Check, Mail, Phone, Calendar, Tag, FileText, ChevronRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";

const COLUMNS = [
  { key: "INQUIRY",     label: "Inquiry",     colBg: "bg-white border-slate-200",      activeBg: "bg-slate-50 border-slate-400",   iconBg: "bg-slate-100",   iconColor: "text-slate-500",  countBg: "bg-slate-200 text-slate-700",   listBg: "bg-slate-50 border-slate-200",   icon: MessageCircle },
  { key: "CONTACTED",   label: "Contacted",   colBg: "bg-white border-blue-200",       activeBg: "bg-blue-50 border-blue-400",     iconBg: "bg-blue-100",    iconColor: "text-blue-600",   countBg: "bg-blue-200 text-blue-700",     listBg: "bg-blue-50 border-blue-200",     icon: PhoneCall },
  { key: "TRIAL",       label: "Trial",       colBg: "bg-white border-yellow-200",     activeBg: "bg-yellow-50 border-yellow-400", iconBg: "bg-yellow-100",  iconColor: "text-yellow-600", countBg: "bg-yellow-200 text-yellow-700", listBg: "bg-yellow-50 border-yellow-200", icon: Dumbbell },
  { key: "NEGOTIATING", label: "Negotiating", colBg: "bg-white border-orange-200",     activeBg: "bg-orange-50 border-orange-400", iconBg: "bg-orange-100",  iconColor: "text-orange-600", countBg: "bg-orange-200 text-orange-700", listBg: "bg-orange-50 border-orange-200", icon: Handshake },
  { key: "CONVERTED",   label: "Converted",   colBg: "bg-white border-green-200",      activeBg: "bg-green-50 border-green-400",   iconBg: "bg-green-100",   iconColor: "text-green-600",  countBg: "bg-green-200 text-green-700",   listBg: "bg-green-50 border-green-200",   icon: CheckCircle2 },
];

export default function LeadBoard({ leads }: { leads: any[] }) {
  const router = useRouter();
  const [activeCol, setActiveCol] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  const byStatus = Object.fromEntries(
    COLUMNS.map((c) => [c.key, leads.filter((l) => l.status === c.key)])
  );

  const selectedCol = COLUMNS.find(c => c.key === activeCol);
  const selectedLeads = activeCol ? (byStatus[activeCol] ?? []) : [];

  async function deleteLead(lead: any) {
    const ok = await confirm({
      title: "Delete Lead?",
      message: `Delete ${lead.firstName} ${lead.lastName}? This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setDeleting(true);
    await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
    setDeleting(false);
    toast.success("Lead deleted.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* 5 Status Column Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {COLUMNS.map((col) => {
          const Icon = col.icon;
          const count = (byStatus[col.key] ?? []).length;
          const isActive = activeCol === col.key;

          return (
            <button
              key={col.key}
              type="button"
              onClick={() => setActiveCol(isActive ? null : col.key)}
              className={`relative overflow-hidden rounded-2xl border-2 p-5 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
                ${isActive ? col.activeBg + " shadow-md" : col.colBg + " hover:border-current"}`}
            >
              {/* Ghost background icon */}
              <Icon
                className={`absolute -right-3 -bottom-3 w-20 h-20 ${col.iconColor} opacity-[0.08] pointer-events-none`}
                strokeWidth={1}
              />

              {/* Icon */}
              <div className={`w-11 h-11 rounded-xl ${col.iconBg} flex items-center justify-center mb-3 transition-transform duration-200 ${isActive ? "scale-110" : ""}`}>
                <Icon className={`w-5 h-5 ${col.iconColor}`} />
              </div>

              {/* Label */}
              <p className="font-semibold text-slate-700 text-sm">{col.label}</p>

              {/* Count — only show if > 0 */}
              {count > 0 && (
                <span className={`inline-block mt-1.5 text-xs font-bold px-2 py-0.5 rounded-full ${col.countBg}`}>
                  {count} {count === 1 ? "lead" : "leads"}
                </span>
              )}

              {/* Active indicator arrow */}
              {isActive && (
                <ChevronRight className={`absolute top-3 right-3 w-4 h-4 ${col.iconColor} rotate-90`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Lead List Panel — appears below when a column is selected */}
      {activeCol && selectedCol && (
        <div className={`rounded-2xl border-2 ${selectedCol.listBg} overflow-hidden`}>
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg ${selectedCol.iconBg} flex items-center justify-center`}>
                <selectedCol.icon className={`w-4 h-4 ${selectedCol.iconColor}`} />
              </div>
              <h3 className="font-bold text-slate-800">{selectedCol.label}</h3>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selectedCol.countBg}`}>
                {selectedLeads.length} {selectedLeads.length === 1 ? "lead" : "leads"}
              </span>
            </div>
            <button onClick={() => setActiveCol(null)} className="btn-icon">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Empty state */}
          {selectedLeads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <selectedCol.icon className={`w-14 h-14 ${selectedCol.iconColor} opacity-20`} strokeWidth={1} />
              <p className="text-slate-400 text-sm font-medium">No leads in {selectedCol.label}</p>
              <Link href="/dashboard/leads/new" className="btn-primary text-sm mt-1">
                Add a Lead
              </Link>
            </div>
          )}

          {/* Lead rows */}
          {selectedLeads.length > 0 && (
            <div className="divide-y divide-black/5">
              {selectedLeads.map((lead) => (
                <div key={lead.id} className="flex items-start sm:items-center justify-between px-4 py-3 sm:px-5 sm:py-4 hover:bg-black/[0.02] transition-colors group gap-3">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full ${selectedCol.iconBg} flex items-center justify-center shrink-0 font-bold text-sm ${selectedCol.iconColor}`}>
                      {lead.firstName[0]}{lead.lastName[0]}
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">
                        {lead.firstName} {lead.lastName}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Mail className="w-3 h-3" />{lead.email}
                        </span>
                        {lead.phone && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Phone className="w-3 h-3" />{lead.phone}
                          </span>
                        )}
                        {lead.source && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Tag className="w-3 h-3" />{lead.source}
                          </span>
                        )}
                        {lead.trialDate && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Calendar className="w-3 h-3" />Trial: {formatDate(lead.trialDate)}
                          </span>
                        )}
                        {lead.notes && (
                          <span className="flex items-center gap-1 text-xs text-slate-400 max-w-xs truncate">
                            <FileText className="w-3 h-3 shrink-0" />{lead.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <span className="text-xs text-slate-400 hidden sm:block">{formatDate(lead.createdAt)}</span>

                    <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/dashboard/leads/${lead.id}`}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:border-slate-300 transition-all"
                        title="Edit">
                        <Pencil className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                      <button onClick={() => deleteLead(lead)} disabled={deleting}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-all"
                        title="Delete">
                        <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
