import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NewFamilyForm from "./NewFamilyForm";

export default async function NewFamilyPage() {
  const members = await prisma.member.findMany({
    select: { id: true, firstName: true, lastName: true, email: true, memberNumber: true },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <Link href="/dashboard/members/families"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Family Plans
      </Link>

      <div className="mb-7">
        <h1 className="page-title">Create Family Plan</h1>
        <p className="text-sm text-slate-500 mt-1">Group members together for shared billing and management.</p>
      </div>

      <NewFamilyForm members={members} />
    </div>
  );
}
