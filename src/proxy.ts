import { NextRequest, NextResponse } from "next/server";

const API_SECRET = process.env.API_SECRET_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host") || request.nextUrl.host;

  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) return true;
    } catch { /* invalid origin */ }
  }

  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost === host) return true;
    } catch { /* invalid referer */ }
  }

  return false;
}

function hasBearerToken(request: NextRequest): boolean {
  if (!API_SECRET) return false;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${API_SECRET}`;
}

function hasValidCronSecret(request: NextRequest): boolean {
  if (!CRON_SECRET) return process.env.NODE_ENV === "development";
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${CRON_SECRET}`) return true;
  return request.headers.get("x-cron-secret") === CRON_SECRET;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/cron/")) {
    if (hasValidCronSecret(request) || hasBearerToken(request) || isAllowedOrigin(request)) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: "Yetkisiz cron erişimi" }, { status: 401 });
  }

  if (pathname === "/api/config-check" || pathname === "/api/panel-auth") {
    return NextResponse.next();
  }

  if (isAllowedOrigin(request) || hasBearerToken(request)) {
    return NextResponse.next();
  }

  return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
}

export const config = {
  matcher: "/api/:path*",
};
