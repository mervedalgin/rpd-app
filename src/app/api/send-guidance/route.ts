import { NextRequest, NextResponse } from 'next/server';
import { formatTelegramMessage } from '@/lib/data';
import { sendTelegramMessage, formatTelegramMessageHTML } from '@/lib/telegram';
import { writeToGoogleSheets } from '@/lib/sheets';
import { YonlendirilenOgrenci, ReferralRecord } from '@/types';
import { supabase } from '@/lib/supabase';
import { getTeachersData, validateTeacherClass, resolveKeyFromDisplay } from '@/lib/teachers';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
  const { students }: { students: YonlendirilenOgrenci[] } = await request.json();
    
    if (!students || students.length === 0) {
      return NextResponse.json(
        { error: 'Öğrenci listesi boş' },
        { status: 400 }
      );
    }

    console.log(`📋 ${students.length} öğrenci için gönderim işlemi başlatılıyor...`);

    // Validate teacher-class mapping using teachers.xlsx
  const { records } = getTeachersData();
    if (records.length > 0) {
      for (const s of students) {
        // s.sinifSube is display text; we validate against teacher's single allowed class
        const keyCandidate = resolveKeyFromDisplay(s.sinifSube) || s.sinifSube;
        const res = validateTeacherClass(s.ogretmenAdi, keyCandidate, records);
        if (!res.valid) {
          return NextResponse.json({ success: false, message: res.message }, { status: 400 });
        }
      }
    }

    // Results tracking
    let telegramSuccess = false;
    let sheetsSuccess = false;
    const errors: string[] = [];

    // 1. Telegram Bot API entegrasyonu
    try {
      const telegramMessages = students.map((student) =>
        formatTelegramMessageHTML(
          student.ogretmenAdi,
          student.ogrenciAdi,
          student.sinifSube,
          student.yonlendirmeNedeni,
          student.not
        )
      );

      const telegramResult = await sendTelegramMessage(telegramMessages);

      if (telegramResult.sent === telegramResult.total) {
        telegramSuccess = true;
      } else {
        telegramSuccess = telegramResult.sent > 0;
        const failureDetails = telegramResult.failures
          .map((f) => `#${f.index + 1}:${f.status ?? 'err'} ${f.body ?? f.error ?? ''}`)
          .join('; ');
        errors.push(`Telegram: ${telegramResult.sent}/${telegramResult.total} gönderildi. Hatalar: ${failureDetails}`);
      }
    } catch (error) {
      console.error('Telegram entegrasyonu hatası:', error);
      errors.push('Telegram entegrasyonu hatası');
    }

    // 2. Google Sheets entegrasyonu
    try {
      sheetsSuccess = await writeToGoogleSheets(students);
      if (!sheetsSuccess) {
        errors.push('Google Sheets kaydı başarısız');
      }
    } catch (error) {
      console.error('Google Sheets entegrasyonu hatası:', error);
      errors.push('Google Sheets entegrasyonu hatası');
    }

    // 3. Supabase referrals tablosuna kayıt (opsiyonel, akışı bozmaz)
    try {
      if (supabase) {
        const payload: ReferralRecord[] = students.map((student) => ({
          teacher_name: student.ogretmenAdi,
          class_key: '', // İleride sinifSube value'su ile doldurulabilir
          class_display: student.sinifSube,
          student_name: student.ogrenciAdi,
          reason: student.yonlendirmeNedeni,
          note: student.not ?? null,
          source: 'web',
        }));

        const { error: supabaseError } = await supabase
          .from('referrals')
          .insert(payload);

        if (supabaseError) {
          console.error('Supabase referrals insert hatası:', supabaseError.message);
          errors.push('Supabase istatistik kaydı yapılamadı');
        }
      } else {
        console.warn('Supabase client tanımlı değil, referrals kaydı atlanıyor');
      }
    } catch (error) {
      console.error('Supabase referrals entegrasyonu hatası:', error);
      errors.push('Supabase istatistik kaydı hatası');
    }

    // 4. Console log (backup)
    console.log('=== RPD Öğrenci Yönlendirme ===');
    students.forEach((student, index) => {
      const message = formatTelegramMessage(
        student.ogretmenAdi,
        student.ogrenciAdi,
        student.sinifSube,
        student.yonlendirmeNedeni
      );
      console.log(`\nÖğrenci ${index + 1}:`);
      console.log(message);
    });

    // Response based on results
    const successCount = (telegramSuccess ? 1 : 0) + (sheetsSuccess ? 1 : 0);
    
    if (successCount === 2) {
      return NextResponse.json({
        success: true,
        message: `${students.length} öğrenci başarıyla Telegram ve Google Sheets'e gönderildi`,
        sentCount: students.length,
        telegram: telegramSuccess,
        sheets: sheetsSuccess
      });
    } else if (successCount === 1) {
      return NextResponse.json({
        success: true,
        message: `${students.length} öğrenci kısmen gönderildi. ${errors.join(', ')}`,
        sentCount: students.length,
        telegram: telegramSuccess,
        sheets: sheetsSuccess,
        warnings: errors
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `Gönderim başarısız: ${errors.join(', ')}`,
        telegram: telegramSuccess,
        sheets: sheetsSuccess,
        errors: errors
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Send Guidance API Error:', error);
    return NextResponse.json(
      { error: 'Gönderim sırasında hata oluştu' },
      { status: 500 }
    );
  }
}