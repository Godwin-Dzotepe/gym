import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import SessionProvider from "@/components/layout/SessionProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  const role = (session.user as any)?.role;
  if (role === "MEMBER") redirect("/portal");

  const settings = await prisma.gymSettings.findFirst({ select: { currency: true } });
  const currency = settings?.currency ?? "GHS";

  return (
    <SessionProvider>
      <ToastProvider>
        <ConfirmProvider>
          <CurrencyProvider currency={currency}>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              {/* On mobile: sidebar is hidden; mobile strip is fixed at top (h-14).
                  On desktop: topbar is shown inside the flex column. */}
              <div className="flex flex-col flex-1 min-w-0 overflow-hidden pt-14 lg:pt-0">
                <div className="hidden lg:block flex-shrink-0">
                  <Topbar />
                </div>
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6">
                  {children}
                </main>
              </div>
            </div>
          </CurrencyProvider>
        </ConfirmProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
