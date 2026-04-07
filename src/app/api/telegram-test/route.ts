import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie } from '@/app/api/panel-auth/route';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Auth kontrolü
  const sessionCookie = request.cookies.get("panel_session")?.value;
  if (!sessionCookie || !verifySessionCookie(sessionCookie)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return NextResponse.json(
      { error: 'Telegram yapılandırması eksik' },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await res.json();

    if (data.ok) {
      return NextResponse.json({
        success: true,
        bot: {
          username: data.result.username,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Bot bağlantısı başarısız' },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: 'Bağlantı testi başarısız' },
      { status: 500 }
    );
  }
}
