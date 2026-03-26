import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { loadStudentData } from '@/lib/data';
import { resolveAsama } from '@/lib/mebbis-mapping';

export const runtime = 'nodejs';

// Bu endpoint dışarıdan bir cron servisi tarafından çağrılacak
// Hafta içi her gün saat 17:00'de çağrılmalı
// Örnek: cron-job.org, Vercel Cron, GitHub Actions, vb.

// Sabit değerler
const CALISMA_YERI = "1";
const GORUSME_SURESI = 20;

function resolveClassKey(classDisplay: string, studentData: ReturnType<typeof loadStudentData>): string {
  const match = studentData.Sinif_Sube.find(s => s.text === classDisplay);
  return match?.value || "";
}

function resolveStudentTC(studentName: string, classDisplay: string, studentData: ReturnType<typeof loadStudentData>): string {
  const key = `Ogrenci_${classDisplay.replace(" / ", " _ ")}`;
  const ogrenciList = studentData[key];

  if (Array.isArray(ogrenciList)) {
    const match = ogrenciList.find(o => {
      const text = (o as { value: string; text: string }).text;
      return text === studentName || text.includes(studentName) || studentName.includes(text);
    });
    if (match) return (match as { value: string; text: string }).value;
  }

  return "";
}

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

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return {
    tarih: `${day}/${month}/${year}`,
    tarih_alt: `${day}.${month}.${year}`
  };
}

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase yapılandırması eksik' }, { status: 500 });
  }

  try {
    // Bugünün tarihini al (Türkiye saati)
    const now = new Date();
    const turkeyTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
    const todayStr = turkeyTime.toISOString().slice(0, 10);

    // Bugünkü yönlendirmeleri al (reason ve note dahil)
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select('id, student_name, class_display, reason, note, created_at')
      .gte('created_at', `${todayStr}T00:00:00`)
      .lte('created_at', `${todayStr}T23:59:59`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Veriler alınamadı' }, { status: 500 });
    }

    const referralList = referrals ?? [];

    if (referralList.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Bugün yönlendirme bulunamadı, JSON oluşturulmadı',
        date: todayStr,
        count: 0
      });
    }

    const studentData = loadStudentData();
    const { tarih, tarih_alt } = formatDate(todayStr);
    const START_HOUR = 12;
    const START_MINUTE = 40;

    const records = referralList.map((ref, index) => {
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

    const jsonData = {
      mode: "bulk",
      total_records: records.length,
      records
    };

    // Supabase'e kaydet
    const { data: saved, error: insertError } = await supabase
      .from('daily_jsons')
      .insert({
        target_date: todayStr,
        json_data: jsonData,
        record_count: records.length,
        source: 'auto',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Daily JSON insert error:', insertError);
      return NextResponse.json({ error: `Kayıt hatası: ${insertError.message}` }, { status: 500 });
    }

    console.log(`✅ Daily JSON otomatik oluşturuldu: ${todayStr}, ${records.length} kayıt`);

    return NextResponse.json({
      success: true,
      date: todayStr,
      count: records.length,
      id: saved.id
    });
  } catch (error) {
    console.error('Cron daily-json error:', error);
    return NextResponse.json({ error: 'JSON oluşturulamadı' }, { status: 500 });
  }
}

// Manuel tetikleme için POST
export async function POST() {
  return GET();
}
