import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Telegram mesaj gönderimi için rate limiting (IP başına 3 mesaj / 5 dakika)
const TELEGRAM_RATE_MAX = 3;
const TELEGRAM_RATE_WINDOW = 5 * 60 * 1000;
const telegramAttempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return NextResponse.json(
      { error: 'Telegram yapılandırması eksik' },
      { status: 500 }
    );
  }

  // Rate limiting
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const record = telegramAttempts.get(ip);
  if (record && now <= record.resetAt && record.count >= TELEGRAM_RATE_MAX) {
    return NextResponse.json({ error: "Çok fazla mesaj gönderimi. Lütfen bekleyin." }, { status: 429 });
  }
  if (!record || now > record.resetAt) {
    telegramAttempts.set(ip, { count: 1, resetAt: now + TELEGRAM_RATE_WINDOW });
  } else {
    record.count++;
  }

  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Mesaj gerekli' },
        { status: 400 }
      );
    }

    // Mesaj uzunluk sınırı
    const sanitizedMessage = message.slice(0, 500);
    const telegramMessage = `*Test Mesajı*\n\n${sanitizedMessage}\n\n_Panel üzerinden gönderildi_`;

    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: telegramMessage,
          parse_mode: 'Markdown',
        }),
      }
    );

    const data = await res.json();

    if (data.ok) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Mesaj gönderilemedi' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Telegram send error:', error);
    return NextResponse.json(
      { error: 'Mesaj gönderilirken hata oluştu' },
      { status: 500 }
    );
  }
}
