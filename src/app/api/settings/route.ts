import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

// settings tablosu key-value yapısındadır (setting_key benzersiz).
// GET  -> { data: Row[] }  (tüm ayarlar)
// POST -> body: { settings: [{ setting_key, setting_value, category }] } veya
//          tek bir { setting_key, setting_value, category }
//          -> setting_key üzerinde upsert -> { success: true }

const noDb = () =>
  NextResponse.json({ error: "Veritabanı bağlantısı yapılandırılmamış" }, { status: 500 });

export async function GET() {
  const supabase = getSupabaseServer();
  if (!supabase) return noDb();
  try {
    const { data, error } = await supabase.from("settings").select("*");
    if (error) {
      console.error("[settings] GET error:", error.message);
      return NextResponse.json({ error: "Ayarlar alınamadı" }, { status: 500 });
    }
    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    console.error("[settings] GET exception:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServer();
  if (!supabase) return noDb();
  try {
    const body = await request.json();
    const rows = Array.isArray(body?.settings)
      ? body.settings
      : Array.isArray(body)
        ? body
        : [body];

    // Yalnızca beklenen alanları al.
    const sanitized = rows
      .filter((r: unknown) => r && typeof r === "object")
      .map((r: Record<string, unknown>) => ({
        setting_key: String(r.setting_key),
        setting_value:
          typeof r.setting_value === "string" ? r.setting_value : JSON.stringify(r.setting_value),
        category: r.category ? String(r.category) : "genel",
        updated_at: new Date().toISOString(),
      }))
      .filter((r: { setting_key: string }) => r.setting_key && r.setting_key !== "undefined");

    if (sanitized.length === 0) {
      return NextResponse.json({ error: "Geçerli ayar bulunamadı" }, { status: 400 });
    }

    const { error } = await supabase
      .from("settings")
      .upsert(sanitized, { onConflict: "setting_key" });

    if (error) {
      console.error("[settings] POST error:", error.message);
      return NextResponse.json({ error: "Ayarlar kaydedilemedi" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[settings] POST exception:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
