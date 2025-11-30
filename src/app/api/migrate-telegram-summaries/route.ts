import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST() {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase yapılandırması eksik' },
      { status: 500 }
    );
  }

  try {
    // Tablo oluşturma SQL'i
    // NOT: Bu işlem için service_role key gerekebilir veya Supabase Dashboard'dan manuel oluşturulmalı
    const { error } = await supabase.rpc('create_telegram_summaries_table');

    if (error) {
      // Eğer RPC yoksa, tablo zaten var veya yetki hatası
      console.log('RPC error (expected if table exists or no RPC):', error.message);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Tablo kontrolü yapıldı. Supabase Dashboard üzerinden aşağıdaki SQL ile tablo oluşturabilirsiniz.',
      sql: `
CREATE TABLE IF NOT EXISTS telegram_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_type VARCHAR(20) NOT NULL,
  period_label VARCHAR(100) NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  referral_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_telegram_summaries_sent_at ON telegram_summaries(sent_at DESC);
      `.trim()
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration hatası' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Supabase Dashboard SQL Editor\'de aşağıdaki SQL\'i çalıştırın:',
    sql: `
CREATE TABLE IF NOT EXISTS telegram_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_type VARCHAR(20) NOT NULL,
  period_label VARCHAR(100) NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  referral_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_summaries_sent_at ON telegram_summaries(sent_at DESC);
    `.trim()
  });
}
