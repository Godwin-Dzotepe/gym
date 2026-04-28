import SessionProvider from "@/components/layout/SessionProvider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
