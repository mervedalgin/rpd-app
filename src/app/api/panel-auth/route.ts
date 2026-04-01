import { NextRequest, NextResponse } from "next/server";

const PANEL_PASSWORD = process.env.PANEL_PASSWORD || process.env.NEXT_PUBLIC_PANEL_PASSWORD || "sagopa";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Şifre gerekli" }, { status: 400 });
    }

    if (password === PANEL_PASSWORD) {
      return NextResponse.json({ authenticated: true });
    }

    return NextResponse.json({ authenticated: false, error: "Yanlış şifre" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
