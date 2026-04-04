import { NextRequest, NextResponse } from "next/server";

const PANEL_PASSWORD = process.env.PANEL_PASSWORD;

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

export async function POST(request: NextRequest) {
  try {
    if (!PANEL_PASSWORD) {
      return NextResponse.json({ error: "Panel yapılandırması eksik" }, { status: 503 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               request.headers.get("x-real-ip") ||
               "unknown";

    const { allowed, remaining } = getRateLimitResult(ip);
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

    if (password === PANEL_PASSWORD) {
      // Başarılı girişte sayacı sıfırla
      attempts.delete(ip);
      return NextResponse.json({ authenticated: true });
    }

    return NextResponse.json(
      { authenticated: false, error: `Yanlış şifre. Kalan deneme: ${remaining}` },
      { status: 401 }
    );
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
