-- =============================================
-- RPD App - Randevu (Appointments) Tablosu
-- =============================================
-- Bu SQL'i Supabase Dashboard > SQL Editor'de çalıştırın

-- 1. appointments tablosu (randevular)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Temel randevu bilgileri
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration INTEGER DEFAULT 15, -- dakika cinsinden (10, 15, 20, 30)
  
  -- Kiminle görüşme
  participant_type TEXT NOT NULL CHECK (participant_type IN ('student', 'parent', 'teacher')),
  participant_name TEXT NOT NULL,
  participant_class TEXT, -- öğrenci/veli için sınıf
  participant_phone TEXT, -- iletişim (opsiyonel)
  
  -- Görüşme detayları
  topic_tags TEXT[] DEFAULT '{}', -- etiketler (devamsızlık, kaygı, vb.)
  location TEXT DEFAULT 'guidance_office' CHECK (location IN ('guidance_office', 'classroom', 'admin', 'phone', 'online', 'other')),
  purpose TEXT, -- görüşmenin hedefi (1 cümle)
  preparation_note TEXT, -- hazırlık notu (opsiyonel)
  
  -- Durum ve öncelik
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'attended', 'not_attended', 'postponed', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
  
  -- Görüşme sonrası (kapanış)
  outcome_summary TEXT, -- kısa sonuç (1-2 cümle)
  outcome_decision TEXT[], -- karar/yönlendirme listesi
  next_action TEXT, -- bir sonraki adım
  next_appointment_id UUID REFERENCES appointments(id), -- takip randevusu
  
  -- Hatırlatma
  reminder_sent BOOLEAN DEFAULT FALSE,
  
  -- Şablon bilgisi
  template_type TEXT CHECK (template_type IN ('student', 'parent', 'teacher'))
);

-- 2. appointment_tasks tablosu (randevu görevleri)
CREATE TABLE IF NOT EXISTS appointment_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  task_description TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  due_date DATE
);

-- 3. appointment_templates tablosu (şablonlar)
CREATE TABLE IF NOT EXISTS appointment_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('student', 'parent', 'teacher')),
  default_topic_tags TEXT[] DEFAULT '{}',
  default_duration INTEGER DEFAULT 15,
  default_location TEXT DEFAULT 'guidance_office',
  purpose_template TEXT,
  outcome_options TEXT[] DEFAULT '{}'
);

-- =============================================
-- RLS (Row Level Security) Politikaları
-- =============================================

-- appointments tablosu için RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon appointments" ON appointments;
CREATE POLICY "Allow all for anon appointments" ON appointments
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- appointment_tasks tablosu için RLS
ALTER TABLE appointment_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon appointment_tasks" ON appointment_tasks;
CREATE POLICY "Allow all for anon appointment_tasks" ON appointment_tasks
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- appointment_templates tablosu için RLS
ALTER TABLE appointment_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon appointment_templates" ON appointment_templates;
CREATE POLICY "Allow all for anon appointment_templates" ON appointment_templates
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- =============================================
-- İndeksler (Performans için)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_participant ON appointments(participant_name);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointment_tasks_appointment ON appointment_tasks(appointment_id);

-- =============================================
-- Updated_at trigger
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Varsayılan şablonları ekle
-- =============================================
INSERT INTO appointment_templates (template_name, template_type, default_topic_tags, default_duration, default_location, purpose_template, outcome_options)
VALUES 
  ('Öğrenci Görüşmesi', 'student', ARRAY['duygu-durum', 'arkadaşlık', 'ders motivasyonu', 'devamsızlık'], 15, 'guidance_office', 'Öğrenci ile bireysel görüşme', ARRAY['Bilgilendirme yapıldı', 'Takip görüşmesi planlandı', 'Sınıf öğretmeniyle iş birliği', 'Veli bilgilendirilecek']),
  ('Veli Görüşmesi', 'parent', ARRAY['bilgilendirme', 'yönlendirme', 'iş birliği', 'ev ortamı'], 20, 'guidance_office', 'Veli ile bilgilendirme görüşmesi', ARRAY['Bilgilendirme yapıldı', 'Evde uygulanacak öneriler verildi', 'Takip görüşmesi planlandı', 'RAM yönlendirmesi yapıldı']),
  ('Öğretmen Görüşmesi', 'teacher', ARRAY['davranış gözlemi', 'akademik durum', 'sosyal uyum', 'sınıf iklimi'], 15, 'classroom', 'Öğretmen ile öğrenci hakkında görüşme', ARRAY['Sınıf içi müdahale önerildi', 'Gözlem devam edecek', 'Takip kontrolü planlandı', 'İdare bilgilendirildi'])
ON CONFLICT DO NOTHING;

-- Başarılı mesajı
SELECT 'Randevu tabloları ve şablonlar başarıyla oluşturuldu!' as message;
