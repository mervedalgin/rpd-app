import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { loadStudentData } from '@/lib/data';
import { resolveAsama } from '@/lib/mebbis-mapping';

export const runtime = 'nodejs';

// Sabit değerler
const CALISMA_YERI = "1";
const GORUSME_SURESI = 20; // dakika

// class_display -> sinif_sube value eşleştirmesi
function resolveClassKey(classDisplay: string, studentData: ReturnType<typeof loadStudentData>): string {
  const match = studentData.Sinif_Sube.find(s => s.text === classDisplay);
  return match?.value || "";
}

// student_name -> TC numarası eşleştirmesi
function resolveStudentTC(studentName: string, classDisplay: string, studentData: ReturnType<typeof loadStudentData>): string {
  // sinif_sube text'inden öğrenci listesi key'i oluştur
  const key = `Ogrenci_${classDisplay.replace(" / ", " _ ")}`;
  const ogrenciList = studentData[key];

  if (Array.isArray(ogrenciList)) {
    // Öğrenci adı "298 AHMET EKİN GÜÇLÜ" formatında olabilir, veya sadece "AHMET EKİN GÜÇLÜ"
    const match = ogrenciList.find(o => {
      const text = (o as { value: string; text: string }).text;
      return text === studentName || text.includes(studentName) || studentName.includes(text);
    });
    if (match) return (match as { value: string; text: string }).value;
  }

  return "";
}

// Saat hesaplama: başlangıç saatinden itibaren 20'şer dk
function calculateTimes(startHour: number, startMinute: number, index: number) {
  const totalMinutes = startHour * 60 + startMinute + (index * GORUSME_SURESI);
  const endTotalMinutes = totalMinutes + GORUSME_SURESI;

  const basH = Math.floor(totalMinutes / 60);
  const basM = totalMinutes % 60;
  const bitH = Math.floor(endTotalMinutes / 60);
  const bitM = endTotalMinutes % 60;

  return {
    saat_bas: `${String(basH).padStart(2, '0')}:${String(basM).padStart(2, '0')}`,
    saat_bitis: `${String(bitH).padStart(2, '0')}:${String(bitM).padStart(2, '0')}`
  };
}

// Tarih formatlama
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return {
    tarih: `${day}/${month}/${year}`,
    tarih_alt: `${day}.${month}.${year}`
  };
}

// Belirli bir tarih için daily JSON oluştur
async function generateDailyJson(targetDate: string, specificStudents?: string[]) {
  if (!supabase) {
    throw new Error('Supabase yapılandırması eksik');
  }

  const studentData = loadStudentData();

  // Yönlendirilen öğrencileri al (reason ve note dahil)
  let query = supabase
    .from('referrals')
    .select('id, student_name, class_display, reason, note, created_at')
    .gte('created_at', `${targetDate}T00:00:00`)
    .lte('created_at', `${targetDate}T23:59:59`)
    .order('created_at', { ascending: true });

  const { data: referrals, error } = await query;

  if (error) {
    throw new Error(`Yönlendirmeler alınamadı: ${error.message}`);
  }

  let filteredReferrals = referrals ?? [];

  // Manuel modda belirli öğrenciler seçildiyse filtrele
  if (specificStudents && specificStudents.length > 0) {
    filteredReferrals = filteredReferrals.filter(r =>
      specificStudents.includes(r.student_name)
    );
  }

  if (filteredReferrals.length === 0) {
    return {
      mode: "bulk",
      total_records: 0,
      records: []
    };
  }

  const { tarih, tarih_alt } = formatDate(targetDate);
  const START_HOUR = 12;
  const START_MINUTE = 40;

  const records = filteredReferrals.map((ref, index) => {
    const sinif_sube = resolveClassKey(ref.class_display, studentData);
    const ogrenci = resolveStudentTC(ref.student_name, ref.class_display, studentData);
    const { saat_bas, saat_bitis } = calculateTimes(START_HOUR, START_MINUTE, index);

    // Dinamik aşama eşleştirmesi: neden + nota göre
    const asama = resolveAsama(ref.reason, ref.note);

    return {
      sinif_sube,
      ogrenci,
      hizmet_turu: asama.hizmet_turu,
      asama1: asama.asama1,
      asama2: asama.asama2,
      asama3: asama.asama3,
      tarih,
      tarih_alt,
      saat_bas,
      saat_bitis,
      calisma_yeri: CALISMA_YERI
    };
  });

  return {
    mode: "bulk",
    total_records: records.length,
    records
  };
}

// GET: Kayıtlı daily JSON'ları listele
export async function GET(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase yapılandırması eksik' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Tek kayıt getir
      const { data, error } = await supabase
        .from('daily_jsons')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 });
      }
      return NextResponse.json(data);
    }

    // Tüm kayıtları getir
    const { data, error } = await supabase
      .from('daily_jsons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: `Listeleme hatası: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('Daily JSON GET error:', error);
    return NextResponse.json({ error: 'Beklenmeyen hata' }, { status: 500 });
  }
}

// POST: Yeni daily JSON oluştur (manuel veya otomatik)
export async function POST(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase yapılandırması eksik' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { target_date, students, source = 'manual' } = body;

    if (!target_date) {
      return NextResponse.json({ error: 'Tarih gerekli' }, { status: 400 });
    }

    // JSON oluştur
    const jsonData = await generateDailyJson(target_date, students);

    if (jsonData.total_records === 0) {
      return NextResponse.json({
        error: 'Seçili tarihte yönlendirme bulunamadı',
        json_data: jsonData
      }, { status: 404 });
    }

    // Supabase'e kaydet
    const { data, error } = await supabase
      .from('daily_jsons')
      .insert({
        target_date,
        json_data: jsonData,
        record_count: jsonData.total_records,
        source,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `Kayıt hatası: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Daily JSON POST error:', error);
    return NextResponse.json({ error: 'JSON oluşturulurken hata oluştu' }, { status: 500 });
  }
}

// PUT: Mevcut daily JSON'ı güncelle
export async function PUT(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase yapılandırması eksik' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { id, json_data } = body;

    if (!id || !json_data) {
      return NextResponse.json({ error: 'ID ve JSON verisi gerekli' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('daily_jsons')
      .update({
        json_data,
        record_count: json_data.total_records ?? json_data.records?.length ?? 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `Güncelleme hatası: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Daily JSON PUT error:', error);
    return NextResponse.json({ error: 'Güncelleme sırasında hata oluştu' }, { status: 500 });
  }
}

// DELETE: Daily JSON sil
export async function DELETE(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase yapılandırması eksik' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });
    }

    const { error } = await supabase
      .from('daily_jsons')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: `Silme hatası: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Daily JSON DELETE error:', error);
    return NextResponse.json({ error: 'Silme sırasında hata oluştu' }, { status: 500 });
  }
}

// generateDailyJson fonksiyonunu dışa aktar (cron endpoint için)
export { generateDailyJson };
