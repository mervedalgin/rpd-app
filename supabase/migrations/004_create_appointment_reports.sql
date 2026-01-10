-- =============================================
-- RPD App - Randevu Raporları Tablosu
-- =============================================
-- Bu SQL'i Supabase Dashboard > SQL Editor'de çalıştırın

-- =============================================
-- RANDEVU RAPORLARI TABLOSU
-- =============================================
CREATE TABLE IF NOT EXISTS appointment_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Randevu bilgileri
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_class TEXT,
  appointment_date DATE,
  
  -- Görüşme notları (kullanıcının girdiği)
  session_notes TEXT,
  
  -- Oluşturulan raporlar (JSON olarak 4 rapor)
  reports JSONB DEFAULT '{}'::jsonb
);

-- Index
CREATE INDEX IF NOT EXISTS idx_appointment_reports_appointment ON appointment_reports(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_reports_student ON appointment_reports(student_name);
CREATE INDEX IF NOT EXISTS idx_appointment_reports_date ON appointment_reports(appointment_date);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_appointment_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS appointment_reports_updated_at ON appointment_reports;
CREATE TRIGGER appointment_reports_updated_at
  BEFORE UPDATE ON appointment_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_appointment_reports_updated_at();

-- RLS Policies
ALTER TABLE appointment_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for appointment_reports" ON appointment_reports
  FOR ALL USING (true) WITH CHECK (true);
