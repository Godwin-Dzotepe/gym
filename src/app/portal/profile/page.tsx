import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PortalProfileForm from "@/components/portal/PortalProfileForm";

export default async function PortalProfilePage() {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId;

  const member = await prisma.member.findUnique({ where: { id: memberId } });

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="page-title">My Profile</h1>
      <PortalProfileForm member={JSON.parse(JSON.stringify(member))} />
    </div>
  );
}
