import { Suspense } from "react";
import MemberForm from "@/components/members/MemberForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewMemberPage() {
  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <Link href="/dashboard/members" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> All Members
        </Link>
        <h1 className="page-title">Add New Member</h1>
        <p className="text-slate-500 text-sm mt-0.5">Create a new member account manually</p>
      </div>
      <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading…</div>}>
        <MemberForm />
      </Suspense>
    </div>
  );
}
