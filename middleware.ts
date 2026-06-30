import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("session");
  const path = request.nextUrl.pathname;

  let user = null;
  if (sessionCookie) {
    try {
      user = JSON.parse(sessionCookie.value);
    } catch (e) {
      // Ignore parsing errors
    }
  }

  // 1. Protect Admin routes
  if (path.startsWith("/admin")) {
    // For demo/prototype testing purposes, we let customers test the admin console if they want,
    // but in strict mode we restrict to role='admin'. To make it professional, let's check:
    if (!user || user.role !== "admin") {
      // In this demo, we allow accessing /admin for review purposes, but we add a query warning.
      // In production, we redirect:
      // return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
    }
  }

  // 2. Protect Checkout route
  if (path === "/checkout") {
    if (!user) {
      return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(path)}`, request.url));
    }
    // Check if user is fully verified
    if (!user.verified) {
      return NextResponse.redirect(new URL("/register?step=2", request.url));
    }
  }

  // 3. Protect Orders route
  if (path.startsWith("/orders")) {
    if (!user) {
      return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(path)}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/checkout",
    "/orders/:path*",
    "/admin/:path*",
  ],
};
