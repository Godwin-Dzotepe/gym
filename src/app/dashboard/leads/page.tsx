import { prisma } from "@/lib/prisma";
import { Plus, MessageCircle, PhoneCall, Dumbbell, Handshake, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import LeadBoard from "./LeadBoard";

export const COLUMNS = [
  { key: "INQUIRY",     label: "Inquiry",     colBg: "bg-slate-50 border-slate-200",    headerColor: "bg-slate-100",   iconBg: "bg-slate-200",   iconColor: "text-slate-500",  countBg: "bg-slate-200 text-slate-600" },
  { key: "CONTACTED",   label: "Contacted",   colBg: "bg-blue-50 border-blue-200",      headerColor: "bg-blue-100",    iconBg: "bg-blue-200",    iconColor: "text-blue-600",   countBg: "bg-blue-200 text-blue-700" },
  { key: "TRIAL",       label: "Trial",       colBg: "bg-yellow-50 border-yellow-200",  headerColor: "bg-yellow-100",  iconBg: "bg-yellow-200",  iconColor: "text-yellow-600", countBg: "bg-yellow-200 text-yellow-700" },
  { key: "NEGOTIATING", label: "Negotiating", colBg: "bg-orange-50 border-orange-200",  headerColor: "bg-orange-100",  iconBg: "bg-orange-200",  iconColor: "text-orange-600", countBg: "bg-orange-200 text-orange-700" },
  { key: "CONVERTED",   label: "Converted",   colBg: "bg-green-50 border-green-200",    headerColor: "bg-green-100",   iconBg: "bg-green-200",   iconColor: "text-green-600",  countBg: "bg-green-200 text-green-700" },
];

export const COLUMN_ICONS: Record<string, any> = {
  INQUIRY: MessageCircle,
  CONTACTED: PhoneCall,
  TRIAL: Dumbbell,
  NEGOTIATING: Handshake,
  CONVERTED: CheckCircle2,
};

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({
    where: { status: { not: "LOST" } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Leads & CRM</h1>
          <p className="text-gray-500 text-sm mt-1">{leads.length} active leads in pipeline</p>
        </div>
        <Link href="/dashboard/leads/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Add Lead
        </Link>
      </div>

      <LeadBoard leads={leads as any} />
    </div>
  );
}
