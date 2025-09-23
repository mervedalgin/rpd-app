import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
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
