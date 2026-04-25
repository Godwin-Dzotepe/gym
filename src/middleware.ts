import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as any)?.role;

  const isAuthRoute = nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register");
  const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard");
  const isPortalRoute = nextUrl.pathname.startsWith("/portal");
  const isKioskRoute = nextUrl.pathname.startsWith("/kiosk");

  if (isAuthRoute) {
    if (isLoggedIn) {
      if (role === "MEMBER") return NextResponse.redirect(new URL("/portal", nextUrl));
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn && (isDashboardRoute || isPortalRoute)) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isLoggedIn && isDashboardRoute && role === "MEMBER") {
    return NextResponse.redirect(new URL("/portal", nextUrl));
  }

  if (isLoggedIn && isPortalRoute && role !== "MEMBER") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
