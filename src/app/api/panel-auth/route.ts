import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual, randomBytes } from "crypto";

const PANEL_PASSWORD = process.env.PANEL_PASSWORD;
const SESSION_SECRET = process.env.CRON_SECRET || process.env.API_SECRET_KEY || "rpd-fallback-secret";

// In-memory rate limiting (IP başına 5 deneme / 5 dakika)
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 dakika
const attempts = new Map<string, { count: number; resetAt: number }>();

function getRateLimitResult(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count };
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function signSession(payload: string): string {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
}

export function verifySessionCookie(cookieValue: string): boolean {
  const parts = cookieValue.split(".");
  if (parts.length !== 3) return false;
  const [payload, expiry, signature] = parts;
  // Check expiry
  const expiryTime = parseInt(expiry, 10);
  if (isNaN(expiryTime) || Date.now() > expiryTime) return false;
  // Check signature
  const expected = signSession(`${payload}.${expiry}`);
  return safeCompare(signature, expected);
}

// GET: Session doğrulama (cookie kontrolü)
export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get("panel_session")?.value;
  if (sessionCookie && verifySessionCookie(sessionCookie)) {
    return NextResponse.json({ authenticated: true });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}

export async function POST(request: NextRequest) {
  try {
    if (!PANEL_PASSWORD) {
      return NextResponse.json({ error: "Panel yapılandırması eksik" }, { status: 503 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               request.headers.get("x-real-ip") ||
               "unknown";

    const { allowed } = getRateLimitResult(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Çok fazla deneme. Lütfen 5 dakika sonra tekrar deneyin." },
        { status: 429, headers: { "Retry-After": "300" } }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Şifre gerekli" }, { status: 400 });
    }

    if (safeCompare(password, PANEL_PASSWORD)) {
      // Başarılı girişte sayacı sıfırla
      attempts.delete(ip);

      // 8 saatlik signed session cookie oluştur
      const payload = randomBytes(16).toString("hex");
      const expiry = Date.now() + 8 * 60 * 60 * 1000; // 8 saat
      const signature = signSession(`${payload}.${expiry}`);
      const cookieValue = `${payload}.${expiry}.${signature}`;

      const response = NextResponse.json({ authenticated: true });
      response.cookies.set("panel_session", cookieValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 8 * 60 * 60, // 8 saat
      });
      return response;
    }

    return NextResponse.json(
      { authenticated: false, error: "Yanlış şifre" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE: Çıkış (cookie temizleme)
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("panel_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
