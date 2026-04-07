import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

const API_SECRET = process.env.API_SECRET_KEY;
const CRON_SECRET = process.env.CRON_SECRET;
const SESSION_SECRET = CRON_SECRET || API_SECRET || "rpd-fallback-secret";

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
  if (!CRON_SECRET) {
    // Development'ta bile cron secret zorunlu olmalı
    return false;
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${CRON_SECRET}`) return true;
  return request.headers.get("x-cron-secret") === CRON_SECRET;
}

function hasValidSession(request: NextRequest): boolean {
  const cookie = request.cookies.get("panel_session")?.value;
  if (!cookie) return false;
  const parts = cookie.split(".");
  if (parts.length !== 3) return false;
  const [payload, expiry, signature] = parts;
  const expiryTime = parseInt(expiry, 10);
  if (isNaN(expiryTime) || Date.now() > expiryTime) return false;
  const expected = createHmac("sha256", SESSION_SECRET).update(`${payload}.${expiry}`).digest("hex");
  return signature === expected;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /api/ routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Cron endpoints: ONLY cron secret or bearer token (no origin check)
  if (pathname.startsWith("/api/cron/")) {
    if (hasValidCronSecret(request) || hasBearerToken(request)) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: "Yetkisiz cron erişimi" }, { status: 401 });
  }

  // Public endpoint: only panel-auth (login)
  if (pathname === "/api/panel-auth") {
    return NextResponse.next();
  }

  // All other API routes: require (same-origin + valid session) or bearer token
  if (hasBearerToken(request)) {
    return NextResponse.next();
  }

  if (isAllowedOrigin(request) && hasValidSession(request)) {
    return NextResponse.next();
  }

  return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
}

export const config = {
  matcher: "/api/:path*",
};
