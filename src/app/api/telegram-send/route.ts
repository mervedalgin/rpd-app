import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return NextResponse.json(
      { error: 'Telegram yapılandırması eksik' },
      { status: 500 }
    );
  }

  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Mesaj gerekli' },
        { status: 400 }
      );
    }

    const telegramMessage = `🧪 *Test Mesajı*\n\n${message}\n\n_Panel üzerinden gönderildi_`;

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
