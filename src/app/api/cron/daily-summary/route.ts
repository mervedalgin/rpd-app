import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

const supabase = getSupabaseServer();

export const runtime = 'nodejs';

// Bu endpoint dışarıdan bir cron servisi tarafından çağrılacak
// Örnek: cron-job.org, Vercel Cron, GitHub Actions, vb.
// Hafta içi her gün saat 17:00'de çağrılmalı

export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return NextResponse.json({ error: 'Telegram yapılandırması eksik' }, { status: 500 });
  }

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase yapılandırması eksik' }, { status: 500 });
  }

  try {
    // Bugünün tarihini al (Türkiye saati)
    const now = new Date();
    const turkeyTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
    const dayOfWeek = turkeyTime.getDay(); // 0 = Pazar, 1 = Pazartesi, ..., 6 = Cumartesi

    const todayStr = turkeyTime.toISOString().slice(0, 10);

    // Bugünkü yönlendirmeleri al
    const { data, error } = await supabase
      .from('referrals')
      .select('student_name, class_display, reason, teacher_name, created_at')
      .gte('created_at', `${todayStr}T00:00:00`)
      .lte('created_at', `${todayStr}T23:59:59`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Veriler alınamadı' }, { status: 500 });
    }

    const referrals = data ?? [];
    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const periodLabel = `⏰ Otomatik Günlük Özet\n📅 ${dayNames[dayOfWeek]}, ${turkeyTime.toLocaleDateString('tr-TR')}`;

    let message: string;

    if (referrals.length === 0) {
      message = `${periodLabel}\n\n✅ Bugün yönlendirme kaydı bulunmuyor.\n\n_Otomatik gönderim (17:00)_`;
    } else {
      message = `${periodLabel}\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      message += `📈 Toplam: ${referrals.length} yönlendirme\n\n`;
      message += `📋 *Yönlendirme Listesi:*\n\n`;

      for (let i = 0; i < referrals.length; i++) {
        const r = referrals[i];
        const studentName = r.student_name || '-';
        const className = r.class_display || '-';
        const reason = r.reason || 'Belirtilmemiş';
        const teacher = r.teacher_name || '-';

        message += `*${i + 1}.* ${studentName}\n`;
        message += `   🏫 ${className} | 📝 ${reason}\n`;
        message += `   👨‍🏫 ${teacher}\n`;
        
        if (i < referrals.length - 1) {
          message += `───────────────────\n`;
        }

        if (message.length > 3500 && i < referrals.length - 1) {
          message += `\n... ve ${referrals.length - i - 1} kayıt daha`;
          break;
        }
      }

      message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
      message += `_Otomatik gönderim (17:00)_`;
    }

    // Telegram'a gönder
    const telegramRes = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      }
    );

    const telegramData = await telegramRes.json();

    if (!telegramData.ok) {
      throw new Error(telegramData.description || 'Telegram mesaj hatası');
    }

    // Özet kaydını kaydet
    await supabase.from('telegram_summaries').insert({
      period_type: 'auto-daily',
      period_label: 'Otomatik Günlük',
      from_date: todayStr,
      to_date: todayStr,
      referral_count: referrals.length,
      message_text: message,
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({ 
      success: true, 
      count: referrals.length,
      date: todayStr,
      day: dayNames[dayOfWeek]
    });
  } catch (error) {
    console.error('Scheduled summary error:', error);
    return NextResponse.json({ error: 'Özet gönderilemedi' }, { status: 500 });
  }
}

// Manuel tetikleme için POST
export async function POST() {
  // POST ile manuel olarak da tetiklenebilir (test amaçlı)
  return GET();
}
