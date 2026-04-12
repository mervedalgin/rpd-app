import { NextRequest, NextResponse } from "next/server";

const API_SECRET = process.env.API_SECRET_KEY;
const CRON_SECRET = process.env.CRON_SECRET;
const SESSION_SECRET = CRON_SECRET || API_SECRET || "rpd-fallback-secret";

function hexEncode(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return hexEncode(signature);
}

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
    return false;
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${CRON_SECRET}`) return true;
  return request.headers.get("x-cron-secret") === CRON_SECRET;
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const cookie = request.cookies.get("panel_session")?.value;
  if (!cookie) return false;
  const parts = cookie.split(".");
  if (parts.length !== 3) return false;
  const [payload, expiry, signature] = parts;
  const expiryTime = parseInt(expiry, 10);
  if (isNaN(expiryTime) || Date.now() > expiryTime) return false;
  const expected = await hmacSha256(SESSION_SECRET, `${payload}.${expiry}`);
  return signature === expected;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/cron/")) {
    if (hasValidCronSecret(request) || hasBearerToken(request)) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: "Yetkisiz cron erişimi" }, { status: 401 });
  }

  if (pathname === "/api/panel-auth") {
    return NextResponse.next();
  }

  if (hasBearerToken(request)) {
    return NextResponse.next();
  }

  if (isAllowedOrigin(request) && (await hasValidSession(request))) {
    return NextResponse.next();
  }

  return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
}

export const config = {
  matcher: "/api/:path*",
};
