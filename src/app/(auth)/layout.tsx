import SessionProvider from "@/components/layout/SessionProvider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex items-center justify-center p-4">
        {children}
      </div>
    </SessionProvider>
  );
}
