import { NextRequest, NextResponse } from "next/server";
import { verifyPanelSession } from "@/lib/auth";

// Next.js 16 proxy (eski adı middleware). /api/* uçlarını korur.
//
// ÖNCEKİ DURUM: Yalnızca same-origin (origin/referer host eşleşmesi) kontrol
// ediliyordu. Bu bir CSRF katmanıdır ama KİMLİK DOĞRULAMAZ — public ana sayfa da
// same-origin olduğundan herkes /api/discipline gibi hassas uçlara erişebiliyordu.
//
// YENİ DURUM (default-deny): Hassas uçlar imzalı panel oturumu (panel_session
// cookie, HMAC) ister. Public yönlendirme formunun ihtiyaç duyduğu uçlar metod
// bazlı ve same-origin şartıyla açık bırakılır. Cron uçları kendi secret'ı ile
// korunur.

const API_SECRET = process.env.API_SECRET_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

// Public yönlendirme formunun (ana sayfa, RPDYonlendirme) ihtiyaç duyduğu uçlar.
const PUBLIC_METHOD_ALLOWLIST: Record<string, string[]> = {
  "/api/data": ["GET"], // sınıf/şube listesi
  "/api/teachers": ["GET"], // öğretmen listesi (POST panel-only → korunur)
  "/api/students": ["GET"], // sınıftaki öğrenci listesi
  "/api/send-guidance": ["POST"], // yönlendirme kaydı oluştur
};

function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host") || request.nextUrl.host;

  if (origin) {
    try {
      if (new URL(origin).host === host) return true;
    } catch { /* invalid origin */ }
  }
  if (referer) {
    try {
      if (new URL(referer).host === host) return true;
    } catch { /* invalid referer */ }
  }
  return false;
}

function hasBearerToken(request: NextRequest): boolean {
  if (!API_SECRET) return false;
  return request.headers.get("authorization") === `Bearer ${API_SECRET}`;
}

function hasValidCronSecret(request: NextRequest): boolean {
  if (!CRON_SECRET) return process.env.NODE_ENV === "development";
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${CRON_SECRET}`) return true;
  return request.headers.get("x-cron-secret") === CRON_SECRET;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Giriş/çıkış/oturum kontrolü — cookie henüz yokken çağrılır.
  if (pathname === "/api/panel-auth") {
    return NextResponse.next();
  }

  // Cron uçları: kendi secret'ı / bearer / (dev'de) origin ile.
  if (pathname.startsWith("/api/cron/")) {
    if (hasValidCronSecret(request) || hasBearerToken(request) || isAllowedOrigin(request)) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: "Yetkisiz cron erişimi" }, { status: 401 });
  }

  // config-check kendi içinde oturum doğrular; public ana sayfada durum göstergesi
  // için çağrılır (same-origin yeterli).
  if (pathname === "/api/config-check") {
    if (isAllowedOrigin(request)) return NextResponse.next();
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  // Public yönlendirme formu uçları: yalnızca izinli metod + same-origin.
  const allowedMethods = PUBLIC_METHOD_ALLOWLIST[pathname];
  if (allowedMethods && allowedMethods.includes(method) && isAllowedOrigin(request)) {
    return NextResponse.next();
  }

  // Hassas/panel uçları: imzalı oturum VEYA server-to-server bearer zorunlu.
  const sessionCookie = request.cookies.get("panel_session")?.value;
  if ((await verifyPanelSession(sessionCookie)) || hasBearerToken(request)) {
    return NextResponse.next();
  }

  return NextResponse.json(
    { error: "Yetkisiz erişim. Lütfen panele giriş yapın." },
    { status: 401 }
  );
}

export const config = {
  matcher: "/api/:path*",
};
