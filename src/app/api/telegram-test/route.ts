import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return NextResponse.json(
      { error: 'Telegram yapılandırması eksik' },
      { status: 500 }
    );
  }

  try {
    // Bot bilgilerini al (getMe)
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await res.json();

    if (data.ok) {
      return NextResponse.json({
        success: true,
        bot: {
          username: data.result.username,
          firstName: data.result.first_name,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Bot bağlantısı başarısız', details: data.description },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Telegram test error:', error);
    return NextResponse.json(
      { error: 'Bağlantı testi başarısız' },
      { status: 500 }
    );
  }
}
