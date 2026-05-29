import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

// Generic CRUD route fabrikası.
//
// Daha önce 13 client sayfası anon Supabase ile doğrudan CRUD yapıyordu; bu hem
// güvenlik açığıydı (anon key herkese açık) hem de RLS migration'larıyla çelişiyordu.
// Bu helper, her tablo için service_role ile çalışan, oturum-korumalı (middleware)
// tek tip API route'ları üretir. Sözleşme:
//   GET    /api/<resource>?from=&to=&limit=   -> { data: Row[] }
//   POST   /api/<resource>  (body = satır)    -> { data: Row }
//   PUT    /api/<resource>  (body = {id,...})  -> { data: Row }
//   DELETE /api/<resource>?id=...              -> { success: true }
//
// GET, created_at üzerinde opsiyonel from/to aralığı ve limit destekler;
// gelişmiş filtreleme client tarafında yapılır (mevcut davranışla uyumlu).

type CrudOptions = {
  orderBy?: string;
  ascending?: boolean;
};

// insert/update gövdesinden sunucunun yönettiği alanları ayıkla.
function stripManaged<T extends Record<string, unknown>>(body: T): Omit<T, "id" | "created_at" | "updated_at"> {
  const clone = { ...body };
  delete (clone as Record<string, unknown>).id;
  delete (clone as Record<string, unknown>).created_at;
  delete (clone as Record<string, unknown>).updated_at;
  return clone;
}

export function createCrudHandlers(table: string, options: CrudOptions = {}) {
  const orderBy = options.orderBy ?? "created_at";
  const ascending = options.ascending ?? false;

  const noDb = () =>
    NextResponse.json({ error: "Veritabanı bağlantısı yapılandırılmamış" }, { status: 500 });

  async function GET(request: NextRequest) {
    const supabase = getSupabaseServer();
    if (!supabase) return noDb();
    try {
      const sp = request.nextUrl.searchParams;
      const from = sp.get("from");
      const to = sp.get("to");
      const limit = sp.get("limit");

      let query = supabase.from(table).select("*").order(orderBy, { ascending });
      if (from) query = query.gte("created_at", `${from}T00:00:00`);
      if (to) query = query.lte("created_at", `${to}T23:59:59`);
      if (limit) {
        const n = parseInt(limit, 10);
        if (!Number.isNaN(n) && n > 0) query = query.limit(n);
      }

      const { data, error } = await query;
      if (error) {
        console.error(`[${table}] GET error:`, error.message);
        return NextResponse.json({ error: "Kayıtlar alınamadı" }, { status: 500 });
      }
      return NextResponse.json({ data: data ?? [] });
    } catch (error) {
      console.error(`[${table}] GET exception:`, error);
      return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
  }

  async function POST(request: NextRequest) {
    const supabase = getSupabaseServer();
    if (!supabase) return noDb();
    try {
      const body = await request.json();
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
      }
      const { data, error } = await supabase
        .from(table)
        .insert(stripManaged(body))
        .select()
        .single();
      if (error) {
        console.error(`[${table}] POST error:`, error.message);
        return NextResponse.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
      }
      return NextResponse.json({ data });
    } catch (error) {
      console.error(`[${table}] POST exception:`, error);
      return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
  }

  async function PUT(request: NextRequest) {
    const supabase = getSupabaseServer();
    if (!supabase) return noDb();
    try {
      const body = await request.json();
      if (!body || typeof body !== "object" || Array.isArray(body) || !body.id) {
        return NextResponse.json({ error: "Güncelleme için id zorunludur" }, { status: 400 });
      }
      const id = body.id;
      const { data, error } = await supabase
        .from(table)
        .update(stripManaged(body))
        .eq("id", id)
        .select()
        .single();
      if (error) {
        console.error(`[${table}] PUT error:`, error.message);
        return NextResponse.json({ error: "Kayıt güncellenemedi" }, { status: 500 });
      }
      return NextResponse.json({ data });
    } catch (error) {
      console.error(`[${table}] PUT exception:`, error);
      return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
  }

  async function DELETE(request: NextRequest) {
    const supabase = getSupabaseServer();
    if (!supabase) return noDb();
    try {
      const id = request.nextUrl.searchParams.get("id");
      if (!id) {
        return NextResponse.json({ error: "Silme için id zorunludur" }, { status: 400 });
      }
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) {
        console.error(`[${table}] DELETE error:`, error.message);
        return NextResponse.json({ error: "Kayıt silinemedi" }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error(`[${table}] DELETE exception:`, error);
      return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
    }
  }

  return { GET, POST, PUT, DELETE };
}
