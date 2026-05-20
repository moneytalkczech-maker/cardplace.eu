import { NextRequest, NextResponse } from "next/server";

const AUTH_REQUIRED = ["/scan", "/collection", "/settings", "/auctions/create", "/profile", "/wanted"];
const ADMIN_REQUIRED = ["/admin"];

function isLoggedIn(req: NextRequest): boolean {
  if (req.cookies.get("cardplace_logged_in")?.value === "1") return true;
  return Boolean(req.headers.get("authorization")?.startsWith("Bearer "));
}

function isAdmin(req: NextRequest): boolean {
  return req.cookies.get("cardplace_role")?.value === "admin";
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (ADMIN_REQUIRED.some((p) => pathname.startsWith(p))) {
    if (!isLoggedIn(req)) {
      return NextResponse.redirect(new URL(`/login?from=${encodeURIComponent(pathname)}`, req.url));
    }
    if (!isAdmin(req)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (AUTH_REQUIRED.some((p) => pathname.startsWith(p))) {
    if (!isLoggedIn(req)) {
      return NextResponse.redirect(new URL(`/login?from=${encodeURIComponent(pathname)}`, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/scan/:path*",
    "/collection/:path*",
    "/settings/:path*",
    "/auctions/create/:path*",
    "/profile/:path*",
    "/wanted/:path*",
    "/admin/:path*",
  ],
};
