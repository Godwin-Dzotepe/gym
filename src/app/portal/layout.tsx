import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SessionProvider from "@/components/layout/SessionProvider";
import PortalNav from "@/components/layout/PortalNav";
import PendingApprovalWall from "@/components/portal/PendingApprovalWall";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  const role = (session.user as any)?.role;
  if (role !== "MEMBER") redirect("/dashboard");

  const memberId = (session.user as any)?.memberId;
  const member = memberId
    ? await prisma.member.findUnique({ where: { id: memberId }, select: { status: true, firstName: true } })
    : null;

  if (!member || member.status === "PENDING") {
    return (
      <SessionProvider>
        <PendingApprovalWall firstName={member?.firstName ?? ""} />
      </SessionProvider>
    );
  }

  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50">
        <PortalNav />
        {/* Sidebar offset on desktop, top-bar offset on mobile */}
        <main className="lg:pl-56 pt-14 lg:pt-0 overflow-x-hidden">
          <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </SessionProvider>
  );
}
