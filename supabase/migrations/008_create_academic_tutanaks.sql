-- Akademik Durum Tespit Tutanakları tablosu
CREATE TABLE IF NOT EXISTS academic_tutanaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Öğrenci bilgileri
  student_name TEXT NOT NULL,
  class_key TEXT,
  class_display TEXT,
  teacher_name TEXT,
  uyruk TEXT DEFAULT 'T.C.',

  -- Tutanak bilgileri
  tutanak_date DATE DEFAULT CURRENT_DATE NOT NULL,
  reasons TEXT[] DEFAULT '{}' NOT NULL,
  notes TEXT,
  template_id TEXT,

  -- Tutanak içeriği (HTML)
  content_html TEXT,

  -- Durum
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'signed', 'delivered', 'archived')),
  type TEXT DEFAULT 'auto' CHECK (type IN ('auto', 'manual')),

  -- Meta
  download_count INT DEFAULT 0
);

-- Performans indexleri
CREATE INDEX IF NOT EXISTS idx_tutanaks_student ON academic_tutanaks (student_name);
CREATE INDEX IF NOT EXISTS idx_tutanaks_date ON academic_tutanaks (tutanak_date DESC);
CREATE INDEX IF NOT EXISTS idx_tutanaks_status ON academic_tutanaks (status);

-- updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_tutanak_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_tutanak_updated_at ON academic_tutanaks;
CREATE TRIGGER set_tutanak_updated_at
  BEFORE UPDATE ON academic_tutanaks
  FOR EACH ROW
  EXECUTE FUNCTION update_tutanak_timestamp();

-- RLS
ALTER TABLE academic_tutanaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon full access on academic_tutanaks"
  ON academic_tutanaks
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
