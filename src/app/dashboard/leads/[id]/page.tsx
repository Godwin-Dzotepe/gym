import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LeadEditForm from "./LeadEditForm";

interface Props { params: Promise<{ id: string }> }

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { activities: { orderBy: { createdAt: "desc" } } },
  });
  if (!lead) notFound();

  return (
    <div className="space-y-5 max-w-4xl">
      <Link href="/dashboard/leads" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-3.5 h-3.5" /> Leads
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h1 className="page-title mb-6">Edit Lead</h1>
            <LeadEditForm lead={lead as any} />
          </div>
        </div>

        <div className="space-y-5">
          {/* Info */}
          <div className="card p-5">
            <h2 className="section-title mb-3">Contact</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-400">Email</dt><dd className="text-slate-700">{lead.email}</dd></div>
              {lead.phone && <div className="flex justify-between"><dt className="text-slate-400">Phone</dt><dd className="text-slate-700">{lead.phone}</dd></div>}
              {lead.source && <div className="flex justify-between"><dt className="text-slate-400">Source</dt><dd className="text-slate-700">{lead.source}</dd></div>}
              {lead.trialDate && <div className="flex justify-between"><dt className="text-slate-400">Trial</dt><dd className="text-slate-700">{formatDate(lead.trialDate)}</dd></div>}
              <div className="flex justify-between"><dt className="text-slate-400">Added</dt><dd className="text-slate-700">{formatDate(lead.createdAt)}</dd></div>
            </dl>
          </div>

          {/* Activity */}
          <div className="card">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="section-title">Activity Log</h2>
            </div>
            {lead.activities.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No activity yet</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {lead.activities.map((a) => (
                  <div key={a.id} className="px-5 py-3">
                    <p className="text-sm font-medium text-slate-700">{a.action}</p>
                    {a.notes && <p className="text-xs text-slate-500 mt-0.5">{a.notes}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">{formatRelativeTime(a.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
