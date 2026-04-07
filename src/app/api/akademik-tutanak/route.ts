import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { searchParams } = new URL(request.url);
    const studentName = searchParams.get("student");
    const tutanakId = searchParams.get("id");

    // Tek tutanak getir (içeriğiyle birlikte)
    if (tutanakId) {
      const { data, error } = await supabase
        .from("academic_tutanaks")
        .select("*")
        .eq("id", tutanakId)
        .single();

      if (error) {
        return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
      }
      return NextResponse.json({ tutanak: data });
    }

    // Öğrenciye ait tüm referral kayıtlarını getir
    let query = supabase
      .from("referrals")
      .select("*")
      .order("created_at", { ascending: false });

    if (studentName) {
      query = query.eq("student_name", studentName);
    }

    const { data: referrals, error } = await query;

    if (error) {
      console.error("Referrals fetch error:", error);
      return NextResponse.json({ error: "Veri yüklenirken hata oluştu" }, { status: 500 });
    }

    // Benzersiz öğrenci listesi çıkar
    const studentMap = new Map<string, {
      student_name: string;
      class_display: string;
      class_key: string;
      teacher_name: string;
      reasons: string[];
      notes: string[];
      referral_count: number;
      first_referral: string;
      last_referral: string;
    }>();

    for (const r of referrals || []) {
      const existing = studentMap.get(r.student_name);
      if (existing) {
        if (!existing.reasons.includes(r.reason)) {
          existing.reasons.push(r.reason);
        }
        if (r.note && !existing.notes.includes(r.note)) {
          existing.notes.push(r.note);
        }
        existing.referral_count++;
        if (r.created_at < existing.first_referral) {
          existing.first_referral = r.created_at;
        }
        if (r.created_at > existing.last_referral) {
          existing.last_referral = r.created_at;
        }
      } else {
        studentMap.set(r.student_name, {
          student_name: r.student_name,
          class_display: r.class_display || r.class_key,
          class_key: r.class_key,
          teacher_name: r.teacher_name,
          reasons: [r.reason],
          notes: r.note ? [r.note] : [],
          referral_count: 1,
          first_referral: r.created_at,
          last_referral: r.created_at,
        });
      }
    }

    const students = Array.from(studentMap.values());

    // Vaka notları
    let caseNotes: Record<string, Array<{ note_type: string; content: string; note_date: string }>> = {};
    try {
      const { data: notes } = await supabase
        .from("case_notes")
        .select("student_name, note_type, content, note_date")
        .order("note_date", { ascending: false });

      if (notes) {
        for (const n of notes) {
          if (!caseNotes[n.student_name]) caseNotes[n.student_name] = [];
          caseNotes[n.student_name].push({ note_type: n.note_type, content: n.content, note_date: n.note_date });
        }
      }
    } catch { /* case_notes yoksa devam */ }

    // Veli iletişim
    let parentContacts: Record<string, number> = {};
    try {
      const { data: contacts } = await supabase.from("parent_contacts").select("student_name");
      if (contacts) {
        for (const c of contacts) {
          parentContacts[c.student_name] = (parentContacts[c.student_name] || 0) + 1;
        }
      }
    } catch { /* parent_contacts yoksa devam */ }

    // Tutanak geçmişi (Supabase'den)
    let tutanakHistory: Array<{
      id: string;
      student_name: string;
      class_display: string;
      teacher_name: string;
      reasons: string[];
      date: string;
      type: string;
      status: string;
      content_html: string | null;
      template_id: string | null;
      download_count: number;
    }> = [];
    try {
      const { data: tutanaks } = await supabase
        .from("academic_tutanaks")
        .select("id, student_name, class_display, teacher_name, reasons, created_at, type, status, content_html, template_id, download_count")
        .order("created_at", { ascending: false })
        .limit(100);

      if (tutanaks) {
        tutanakHistory = tutanaks.map((t) => ({
          id: t.id,
          student_name: t.student_name,
          class_display: t.class_display || "",
          teacher_name: t.teacher_name || "",
          reasons: t.reasons || [],
          date: t.created_at,
          type: t.type || "auto",
          status: t.status || "created",
          content_html: t.content_html,
          template_id: t.template_id,
          download_count: t.download_count || 0,
        }));
      }
    } catch { /* academic_tutanaks yoksa devam */ }

    return NextResponse.json({
      students,
      caseNotes,
      parentContacts,
      totalReferrals: referrals?.length || 0,
      tutanakHistory,
    });
  } catch (error) {
    console.error("Akademik tutanak API error:", error);
    return NextResponse.json({ error: "Veri yüklenirken hata oluştu" }, { status: 500 });
  }
}

// Tutanak kaydet
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const body = await request.json();
    const { student_name, class_key, class_display, teacher_name, uyruk, tutanak_date, reasons, notes, content_html, type, template_id } = body;

    if (!student_name) {
      return NextResponse.json({ error: "Öğrenci adı gerekli" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("academic_tutanaks")
      .insert({
        student_name,
        class_key: class_key || null,
        class_display: class_display || null,
        teacher_name: teacher_name || null,
        uyruk: uyruk || "T.C.",
        tutanak_date: tutanak_date || new Date().toISOString().slice(0, 10),
        reasons: reasons || [],
        notes: notes || null,
        content_html: content_html || null,
        type: type || "auto",
        template_id: template_id || null,
        status: "created",
        download_count: 1,
      })
      .select()
      .single();

    if (error) {
      console.error("Tutanak insert error:", error);
      return NextResponse.json({ error: "Tutanak kaydedilemedi" }, { status: 500 });
    }

    return NextResponse.json({ tutanak: data });
  } catch (error) {
    console.error("Tutanak POST error:", error);
    return NextResponse.json({ error: "Tutanak kaydedilemedi" }, { status: 500 });
  }
}

// Tutanak güncelle (içerik veya durum)
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const body = await request.json();
    const { id, content_html, status, download_count } = body;

    if (!id) {
      return NextResponse.json({ error: "Tutanak ID gerekli" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (content_html !== undefined) updates.content_html = content_html;
    if (status !== undefined) updates.status = status;
    // download_count kullanıcı tarafından değiştirilemez - sadece server tarafından artırılabilir

    const { data, error } = await supabase
      .from("academic_tutanaks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Tutanak update error:", error);
      return NextResponse.json({ error: "Tutanak güncellenemedi" }, { status: 500 });
    }

    return NextResponse.json({ tutanak: data });
  } catch (error) {
    console.error("Tutanak PUT error:", error);
    return NextResponse.json({ error: "Tutanak güncellenemedi" }, { status: 500 });
  }
}

// Tutanak sil
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Tutanak ID gerekli" }, { status: 400 });
    }

    const { error } = await supabase
      .from("academic_tutanaks")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Tutanak delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tutanak DELETE error:", error);
    return NextResponse.json({ error: "Tutanak silinemedi" }, { status: 500 });
  }
}
