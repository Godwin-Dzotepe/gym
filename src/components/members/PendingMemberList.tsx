"use client";

import { useState } from "react";
import {
  User, Mail, Phone, MapPin, Calendar, Shield,
  CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Hash, CreditCard, FileText, Loader2, Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface PendingMember {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  address: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  waiverSigned: boolean;
  createdAt: string;
  planName: string | null;
  transactionId: string | null;
  invoiceTotal: number | null;
  invoiceDescription: string | null;
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-32 flex-shrink-0 font-medium">{label}</span>
      <span className="text-sm text-gray-800 flex-1">{value}</span>
    </div>
  );
}

function MemberCard({ member }: { member: PendingMember }) {
  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState<"APPROVE" | "DECLINE" | null>(null);
  const [done, setDone] = useState<"APPROVED" | "DECLINED" | null>(null);
  const router = useRouter();

  async function review(action: "APPROVE" | "DECLINE") {
    setActionLoading(action);
    const res = await fetch(`/api/members/${member.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setActionLoading(null);
    if (res.ok) {
      setDone(action === "APPROVE" ? "APPROVED" : "DECLINED");
      router.refresh();
    }
  }

  const initials = `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
  const dob = member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : null;
  const joined = new Date(member.createdAt).toLocaleString();

  if (done) {
    return (
      <div className={`card p-5 flex items-center gap-4 ${done === "APPROVED" ? "border-l-4 border-emerald-400" : "border-l-4 border-red-400"}`}>
        {done === "APPROVED"
          ? <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
          : <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
        }
        <div>
          <p className="font-semibold text-gray-900">{member.firstName} {member.lastName}</p>
          <p className={`text-sm ${done === "APPROVED" ? "text-emerald-600" : "text-red-500"}`}>
            {done === "APPROVED" ? "Approved — message sent to member" : "Declined — member notified"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Header row */}
      <div className="p-5 flex items-center gap-4">
        <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900">{member.firstName} {member.lastName}</p>
            <span className="badge badge-yellow text-[10px]"><Clock className="w-3 h-3" /> Pending</span>
            {member.waiverSigned && <span className="badge badge-green text-[10px]">Waiver Signed</span>}
          </div>
          <div className="flex flex-wrap gap-3 mt-1">
            <span className="text-xs text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" />{member.email}</span>
            {member.phone && <span className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{member.phone}</span>}
            {member.planName && <span className="text-xs text-gray-400 flex items-center gap-1"><CreditCard className="w-3 h-3" />{member.planName}</span>}
          </div>
          {member.transactionId && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">
              <Hash className="w-3 h-3 text-amber-600" />
              <span className="text-xs font-mono font-semibold text-amber-700">TXN: {member.transactionId}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setExpanded(e => !e)}
            className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? "Hide" : "View"}
          </button>
          <button
            onClick={() => review("APPROVE")}
            disabled={!!actionLoading}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 flex items-center gap-1.5 transition-colors">
            {actionLoading === "APPROVE" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Approve
          </button>
          <button
            onClick={() => review("DECLINE")}
            disabled={!!actionLoading}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 flex items-center gap-1.5 transition-colors">
            {actionLoading === "DECLINE" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
            Decline
          </button>
        </div>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Personal Info */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Personal Info
              </p>
              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <DetailRow label="Member #" value={member.memberNumber} />
                <DetailRow label="Full Name" value={`${member.firstName} ${member.lastName}`} />
                <DetailRow label="Email" value={member.email} />
                <DetailRow label="Phone" value={member.phone} />
                <DetailRow label="Gender" value={member.gender} />
                <DetailRow label="Date of Birth" value={dob} />
                <DetailRow label="Address" value={member.address} />
                <DetailRow label="Registered" value={joined} />
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Emergency Contact
              </p>
              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <DetailRow label="Name" value={member.emergencyName} />
                <DetailRow label="Phone" value={member.emergencyPhone} />
                {!member.emergencyName && !member.emergencyPhone && (
                  <p className="text-xs text-gray-400 py-1">No emergency contact provided</p>
                )}
              </div>

              {/* Waiver */}
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 mt-4 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Waiver
              </p>
              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <div className={`flex items-center gap-2 text-sm ${member.waiverSigned ? "text-emerald-600" : "text-red-500"}`}>
                  {member.waiverSigned
                    ? <><CheckCircle2 className="w-4 h-4" /> Signed</>
                    : <><XCircle className="w-4 h-4" /> Not signed</>
                  }
                </div>
              </div>
            </div>

            {/* Plan & Payment */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" /> Plan & Payment
              </p>
              <div className="bg-white rounded-xl p-3 border border-gray-100">
                <DetailRow label="Plan" value={member.planName ?? "No plan selected"} />
                <DetailRow label="Description" value={member.invoiceDescription} />
                <DetailRow label="Amount" value={member.invoiceTotal != null ? `GHS ${member.invoiceTotal.toLocaleString()}` : null} />
                <DetailRow label="Transaction ID" value={member.transactionId} />
                {!member.transactionId && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1.5 mt-1">No transaction ID provided</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PendingMemberList({ members }: { members: PendingMember[] }) {
  if (members.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
        </div>
        <h3 className="font-semibold text-gray-900">All caught up!</h3>
        <p className="text-sm text-gray-400 mt-1">No pending registrations at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.map(m => <MemberCard key={m.id} member={m} />)}
    </div>
  );
}
