import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import MemberForm from "@/components/members/MemberForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props { params: Promise<{ id: string }> }

export default async function EditMemberPage({ params }: Props) {
  const { id } = await params;
  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) notFound();

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <Link href={`/dashboard/members/${id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> {member.firstName} {member.lastName}
        </Link>
        <h1 className="page-title">Edit Member</h1>
        <p className="text-slate-500 text-sm mt-0.5">Update member profile information</p>
      </div>
      <MemberForm defaultValues={JSON.parse(JSON.stringify(member))} memberId={id} />
    </div>
  );
}
