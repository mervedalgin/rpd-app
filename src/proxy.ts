import { NextRequest, NextResponse } from "next/server";

const API_SECRET = process.env.API_SECRET_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  if (!appUrl) {
    // Development fallback: allow if no APP_URL configured
    return process.env.NODE_ENV === "development";
  }

  if (origin && origin.startsWith(appUrl)) return true;
  if (referer && referer.startsWith(appUrl)) return true;

  return false;
}

function hasBearerToken(request: NextRequest): boolean {
  if (!API_SECRET) return false;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${API_SECRET}`;
}

function hasValidCronSecret(request: NextRequest): boolean {
  if (!CRON_SECRET) return process.env.NODE_ENV === "development";
  return request.headers.get("x-vercel-cron") === CRON_SECRET;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /api/ routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Cron endpoints: require cron secret or bearer token
  if (pathname.startsWith("/api/cron/")) {
    if (hasValidCronSecret(request) || hasBearerToken(request)) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: "Yetkisiz cron erişimi" }, { status: 401 });
  }

  // Public endpoints (no auth required)
  if (pathname === "/api/config-check" || pathname === "/api/panel-auth") {
    return NextResponse.next();
  }

  // All other API routes: require same-origin or bearer token
  if (isAllowedOrigin(request) || hasBearerToken(request)) {
    return NextResponse.next();
  }

  return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
}

export const config = {
  matcher: "/api/:path*",
};
