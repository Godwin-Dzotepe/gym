import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, Plus, Crown } from "lucide-react";
import FamiliesClient from "./FamiliesClient";

export default async function FamiliesPage() {
  const families = await prisma.family.findMany({
    include: {
      members: {
        include: { member: { select: { id: true, firstName: true, lastName: true, status: true, email: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalMembers = families.reduce((s, f) => s + f.members.length, 0);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Family Plans</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage linked member accounts and shared billing</p>
        </div>
        <Link href="/dashboard/members/families/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New Family
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Family Accounts", value: families.length.toString(),  icon: Users,  card: "bg-violet-500 hover:bg-violet-600",  iconBg: "bg-violet-400/30" },
          { label: "Total Members",   value: totalMembers.toString(),      icon: Crown,  card: "bg-indigo-500 hover:bg-indigo-600",  iconBg: "bg-indigo-400/30" },
          { label: "Avg. per Family", value: families.length > 0 ? (totalMembers / families.length).toFixed(1) : "—", icon: Users, card: "bg-sky-500 hover:bg-sky-600", iconBg: "bg-sky-400/30" },
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

      <FamiliesClient families={families.map(f => ({
        id: f.id,
        name: f.name,
        members: f.members.map(fm => ({
          id: fm.id,
          memberId: fm.memberId,
          isPrimary: fm.isPrimary,
          relationship: fm.relationship,
          member: fm.member,
        })),
      }))} />
    </div>
  );
}
