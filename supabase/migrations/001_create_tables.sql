-- =============================================
-- RPD App - Supabase Tablo ve Politika Ayarları
-- =============================================
-- Bu SQL'i Supabase Dashboard > SQL Editor'de çalıştırın

-- 1. referrals tablosu (ana yönlendirme kayıtları)
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  teacher_name TEXT,
  class_key TEXT,
  class_display TEXT,
  student_name TEXT NOT NULL,
  reason TEXT,
  note TEXT,
  source TEXT DEFAULT 'web'
);

-- 2. discipline_records tablosunu oluştur (disiplin kayıtları)
CREATE TABLE IF NOT EXISTS discipline_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  class_key TEXT,
  class_display TEXT,
  event_date DATE,
  reason TEXT,
  penalty_type TEXT NOT NULL,
  notes TEXT
);

-- 3. class_students tablosu (sınıf öğrencileri)
CREATE TABLE IF NOT EXISTS class_students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  class_key TEXT NOT NULL,
  class_display TEXT,
  student_name TEXT NOT NULL,
  student_number TEXT
);

-- 4. telegram_summaries tablosu (telegram özetleri)
CREATE TABLE IF NOT EXISTS telegram_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  summary_date DATE,
  content TEXT,
  stats JSONB
);

-- =============================================
-- RLS (Row Level Security) Politikaları
-- =============================================

-- referrals tablosu için RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon referrals" ON referrals;
CREATE POLICY "Allow all for anon referrals" ON referrals
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- discipline_records tablosu için RLS
ALTER TABLE discipline_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon discipline" ON discipline_records;
CREATE POLICY "Allow all for anon discipline" ON discipline_records
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- class_students tablosu için RLS
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon class_students" ON class_students;
CREATE POLICY "Allow all for anon class_students" ON class_students
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- telegram_summaries tablosu için RLS
ALTER TABLE telegram_summaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon telegram" ON telegram_summaries;
CREATE POLICY "Allow all for anon telegram" ON telegram_summaries
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- =============================================
-- İndeksler (Performans için)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_referrals_student_name ON referrals(student_name);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discipline_student_name ON discipline_records(student_name);
CREATE INDEX IF NOT EXISTS idx_discipline_created_at ON discipline_records(created_at DESC);

-- Başarılı mesajı
SELECT 'Tüm tablolar ve RLS politikaları başarıyla oluşturuldu!' as message;
