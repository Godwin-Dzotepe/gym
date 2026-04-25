import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import StaffTable from "./StaffTable";
import { Users, UserCheck, UserX, Shield } from "lucide-react";

export default async function StaffPage() {
  const staff = await prisma.staff.findMany({
    include: { user: { select: { id: true, email: true, role: true } } },
    orderBy: { firstName: "asc" },
  });

  const active = staff.filter(s => s.isActive).length;
  const admins = staff.filter(s => s.user.role === "SUPER_ADMIN").length;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage team members and their access levels</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Staff",    value: staff.length.toString(),  icon: Users,     card: "bg-indigo-500 hover:bg-indigo-600",  iconBg: "bg-indigo-400/30" },
          { label: "Active",         value: active.toString(),        icon: UserCheck, card: "bg-emerald-500 hover:bg-emerald-600", iconBg: "bg-emerald-400/30" },
          { label: "Inactive",       value: (staff.length - active).toString(), icon: UserX, card: "bg-slate-500 hover:bg-slate-600", iconBg: "bg-slate-400/30" },
          { label: "Admins",         value: admins.toString(),        icon: Shield,    card: "bg-orange-500 hover:bg-orange-600",   iconBg: "bg-orange-400/30" },
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

      <StaffTable staff={staff.map(s => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.user.email,
        phone: s.phone ?? "",
        position: s.position ?? "",
        role: s.user.role,
        isActive: s.isActive,
        createdAt: s.createdAt.toISOString(),
        startDate: s.startDate?.toISOString() ?? null,
        endDate: s.endDate?.toISOString() ?? null,
      }))} />
    </div>
  );
}
