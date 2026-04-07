import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

const supabase = getSupabaseServer();
import { appointmentCreateSchema, appointmentUpdateSchema, validateBody } from "@/lib/validation";

// GET - Randevuları listele
export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Veritabanı bağlantısı yapılandırılmamış" },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const status = searchParams.get("status");
    const participantType = searchParams.get("participantType");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    let query = supabase
      .from("appointments")
      .select("*")
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true });

    // Tek gün filtresi
    if (date) {
      query = query.eq("appointment_date", date);
    }

    // Tarih aralığı filtresi
    if (from && to) {
      query = query.gte("appointment_date", from).lte("appointment_date", to);
    } else if (from) {
      query = query.gte("appointment_date", from);
    } else if (to) {
      query = query.lte("appointment_date", to);
    }

    // Durum filtresi
    if (status) {
      query = query.eq("status", status);
    }

    // Katılımcı türü filtresi
    if (participantType) {
      query = query.eq("participant_type", participantType);
    }

    // Öncelik filtresi
    if (priority) {
      query = query.eq("priority", priority);
    }

    // Arama filtresi (max 100 karakter)
    if (search) {
      const sanitizedSearch = search.slice(0, 100);
      query = query.ilike("participant_name", `%${sanitizedSearch.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Randevular alınamadı" },
        { status: 500 }
      );
    }

    return NextResponse.json({ appointments: data || [] });
  } catch (error) {
    console.error("Appointments GET error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}

// POST - Yeni randevu oluştur
export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Veritabanı bağlantısı yapılandırılmamış" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const result = validateBody(appointmentCreateSchema, body);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const validated = result.data;

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        ...validated,
        status: "planned",
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Randevu oluşturulamadı" },
        { status: 500 }
      );
    }

    return NextResponse.json({ appointment: data, message: "Randevu oluşturuldu" });
  } catch (error) {
    console.error("Appointments POST error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}

// PUT - Randevu güncelle
export async function PUT(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Veritabanı bağlantısı yapılandırılmamış" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const result = validateBody(appointmentUpdateSchema, body);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const { id, ...updateData } = result.data;

    const { data, error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json(
        { error: "Randevu güncellenemedi" },
        { status: 500 }
      );
    }

    return NextResponse.json({ appointment: data, message: "Randevu güncellendi" });
  } catch (error) {
    console.error("Appointments PUT error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}

// DELETE - Randevu sil
export async function DELETE(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Veritabanı bağlantısı yapılandırılmamış" },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Randevu ID zorunludur" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json(
        { error: "Randevu silinemedi" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Randevu silindi" });
  } catch (error) {
    console.error("Appointments DELETE error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
