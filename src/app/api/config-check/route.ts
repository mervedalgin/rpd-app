import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie } from '@/app/api/panel-auth/route';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Auth kontrolü - sadece oturum açmış kullanıcılar erişebilir
  const sessionCookie = request.cookies.get("panel_session")?.value;
  if (!sessionCookie || !verifySessionCookie(sessionCookie)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const telegram = Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
  const sheets = Boolean(
    process.env.SHEETS_SPREADSHEET_ID &&
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL &&
    process.env.GOOGLE_SHEETS_PRIVATE_KEY
  );

  return NextResponse.json({
    telegram,
    sheets,
    configured: telegram && sheets,
  });
}
