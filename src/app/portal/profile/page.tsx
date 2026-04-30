import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInitials } from "@/lib/utils";
import PortalProfileForm from "@/components/portal/PortalProfileForm";

export default async function PortalProfilePage() {
  const session = await auth();
  const memberId = (session?.user as any)?.memberId;

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  const memberData = JSON.parse(JSON.stringify(member));

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="page-title">My Profile</h1>

      {/* Identity card */}
      <div className="card p-5 flex items-center gap-4">
        {memberData?.profilePhoto ? (
          <img
            src={memberData.profilePhoto}
            alt="Profile"
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-xl font-bold text-indigo-600">
            {getInitials(memberData?.firstName ?? "", memberData?.lastName ?? "")}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-lg truncate">
            {memberData?.firstName} {memberData?.lastName}
          </p>
          <p className="text-sm text-gray-500 truncate">{memberData?.email}</p>
          {memberData?.memberNumber && (
            <p className="text-xs text-gray-400 mt-0.5">Member #{memberData.memberNumber}</p>
          )}
        </div>
      </div>

      <PortalProfileForm member={memberData} />
    </div>
  );
}
