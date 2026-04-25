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
    <div className="space-y-5 max-w-2xl">
      <Link href="/dashboard/billing/plans" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-3.5 h-3.5" /> Plans
      </Link>
      <div className="card p-6">
        <h1 className="page-title mb-6">Edit Plan</h1>
        <EditPlanForm plan={plan as any} />
      </div>
    </div>
  );
}
