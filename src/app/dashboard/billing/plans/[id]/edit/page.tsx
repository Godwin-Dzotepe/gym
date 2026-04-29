import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditPlanForm from "./EditPlanForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props { params: Promise<{ id: string }> }

export default async function EditPlanPage({ params }: Props) {
  const { id } = await params;
  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) notFound();

  return (
    <div className="max-w-2xl mx-auto pb-10">

      <Link href="/dashboard/billing/plans"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Membership Plans
      </Link>

      <div className="mb-7">
        <h1 className="page-title">Edit Membership Plan</h1>
        <p className="text-sm text-slate-500 mt-1">Update pricing, duration, and access for <span className="font-medium text-slate-700">{plan.name}</span>.</p>
      </div>

      <EditPlanForm plan={JSON.parse(JSON.stringify(plan))} />
    </div>
  );
}
