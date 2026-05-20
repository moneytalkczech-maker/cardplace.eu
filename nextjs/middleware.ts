import { NextRequest, NextResponse } from "next/server";

const AUTH_REQUIRED = ["/scan", "/collection", "/settings", "/auctions/create", "/profile", "/wanted"];
const ADMIN_REQUIRED = ["/admin"];

function isLoggedIn(req: NextRequest): boolean {
  const flag = req.cookies.get("cardplace_logged_in")?.value;
  if (flag === "1") return true;
  const auth = req.headers.get("authorization");
  return Boolean(auth?.startsWith("Bearer "));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (ADMIN_REQUIRED.some((p) => pathname.startsWith(p))) {
    if (!isLoggedIn(req)) {
      return NextResponse.redirect(new URL(`/login?from=${encodeURIComponent(pathname)}`, req.url));
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
