import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

type SummaryPeriod = 'today' | 'week' | 'month' | 'all' | 'custom';

interface ReferralRow {
  student_name: string;
  class_display: string;
  reason: string;
  teacher_name: string;
  created_at: string;
}

export async function GET() {
  // Gönderilen özetleri listele
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase yapılandırması eksik' }, { status: 500 });
  }

  try {
    const { data, error } = await supabase
      .from('telegram_summaries')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(50);

    if (error) {
      // Tablo yoksa boş dön
      if (error.code === '42P01') {
        return NextResponse.json({ summaries: [], needsTable: true });
      }
      throw error;
    }

    return NextResponse.json({ summaries: data ?? [] });
  } catch (error) {
    console.error('Get summaries error:', error);
    return NextResponse.json({ error: 'Özetler alınamadı' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return NextResponse.json(
      { error: 'Telegram yapılandırması eksik' },
      { status: 500 }
    );
  }

  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase yapılandırması eksik' },
      { status: 500 }
    );
  }

  try {
    const { period, customDate } = await request.json() as { period: SummaryPeriod; customDate?: string };

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    let fromDate: string;
    let toDate: string = todayStr;
    let periodLabel: string;

    switch (period) {
      case 'today':
        fromDate = todayStr;
        periodLabel = `📅 Günlük Özet (${new Date(todayStr).toLocaleDateString('tr-TR')})`;
        break;
      case 'week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1);
        fromDate = startOfWeek.toISOString().slice(0, 10);
        periodLabel = `📆 Haftalık Özet (${new Date(fromDate).toLocaleDateString('tr-TR')} - ${new Date(toDate).toLocaleDateString('tr-TR')})`;
        break;
      case 'month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        fromDate = startOfMonth.toISOString().slice(0, 10);
        periodLabel = `🗓️ Aylık Özet (${today.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })})`;
        break;
      case 'all':
        fromDate = '2000-01-01';
        periodLabel = '📊 Tüm Zamanlar Özeti';
        break;
      case 'custom':
        if (!customDate) {
          return NextResponse.json({ error: 'Özel tarih belirtilmedi' }, { status: 400 });
        }
        fromDate = customDate;
        toDate = customDate;
        periodLabel = `📅 ${new Date(customDate).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} Özeti`;
        break;
      default:
        return NextResponse.json({ error: 'Geçersiz dönem' }, { status: 400 });
    }

    // Verileri çek
    let query = supabase
      .from('referrals')
      .select('student_name, class_display, reason, teacher_name, created_at')
      .gte('created_at', `${fromDate}T00:00:00`)
      .lte('created_at', `${toDate}T23:59:59`)
      .order('created_at', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Veriler alınamadı' }, { status: 500 });
    }

    const referrals = (data ?? []) as ReferralRow[];

    // Dönem etiketini hazırla
    const periodLabelShort = {
      today: 'Günlük',
      week: 'Haftalık',
      month: 'Aylık',
      all: 'Tüm Zamanlar',
      custom: `Özel (${customDate})`
    }[period];

    if (referrals.length === 0) {
      // Boş özet mesajı
      const emptyMessage = `${periodLabel}\n\n❌ Bu dönemde yönlendirme kaydı bulunmuyor.`;
      
      await sendTelegramMessage(botToken, chatId, emptyMessage);

      // Boş özeti de kaydet
      const { error: insertError } = await supabase.from('telegram_summaries').insert({
        period_type: period,
        period_label: periodLabelShort,
        from_date: fromDate,
        to_date: toDate,
        referral_count: 0,
        message_text: emptyMessage,
        sent_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error('Empty summary save error:', insertError);
      }

      return NextResponse.json({ success: true, count: 0, saved: !insertError });
    }

    // Mesaj oluştur
    let message = `${periodLabel}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📈 Toplam: ${referrals.length} yönlendirme\n\n`;

    // Tablo başlığı
    message += `📋 *Yönlendirme Listesi:*\n\n`;

    // Her bir yönlendirme için
    for (let i = 0; i < referrals.length; i++) {
      const r = referrals[i];
      const date = new Date(r.created_at).toLocaleDateString('tr-TR');
      const studentName = r.student_name || '-';
      const className = r.class_display || '-';
      const reason = r.reason || 'Belirtilmemiş';
      const teacher = r.teacher_name || '-';

      message += `*${i + 1}.* ${studentName}\n`;
      message += `   📅 ${date} | 🏫 ${className}\n`;
      message += `   📝 ${reason}\n`;
      message += `   👨‍🏫 ${teacher}\n`;
      
      if (i < referrals.length - 1) {
        message += `───────────────────\n`;
      }

      // Telegram mesaj limiti kontrolü (4096 karakter)
      if (message.length > 3500 && i < referrals.length - 1) {
        message += `\n... ve ${referrals.length - i - 1} kayıt daha`;
        break;
      }
    }

    message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `_Panel üzerinden gönderildi_`;

    await sendTelegramMessage(botToken, chatId, message);

    // Özet kaydını Supabase'e kaydet
    const { error: insertError } = await supabase.from('telegram_summaries').insert({
      period_type: period,
      period_label: periodLabelShort,
      from_date: fromDate,
      to_date: toDate,
      referral_count: referrals.length,
      message_text: message,
      sent_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error('Summary save error:', insertError);
    }

    return NextResponse.json({ success: true, count: referrals.length, saved: !insertError });
  } catch (error) {
    console.error('Telegram summary error:', error);
    return NextResponse.json(
      { error: 'Özet gönderilirken hata oluştu' },
      { status: 500 }
    );
  }
}

async function sendTelegramMessage(botToken: string, chatId: string, text: string) {
  const res = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
      }),
    }
  );

  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || 'Telegram mesaj hatası');
  }
  return data;
}
