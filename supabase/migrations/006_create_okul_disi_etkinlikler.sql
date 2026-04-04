-- Okul Dışı Etkinlik tablosu
CREATE TABLE IF NOT EXISTS okul_disi_etkinlikler (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  etkinlik_adi TEXT NOT NULL,
  etkinlik_tarihi DATE NOT NULL,
  mekan TEXT NOT NULL,
  guzergah TEXT,
  cikis_saati TEXT,
  donus_saati TEXT,
  sure TEXT,
  ogretmen_adi TEXT NOT NULL,
  sinif_key TEXT NOT NULL,
  sinif_display TEXT NOT NULL,
  refakatci TEXT,
  arac_plaka TEXT,
  arac_sofor TEXT,
  arac_firma TEXT,
  arac_telefon TEXT,
  katilimci_sayisi INTEGER DEFAULT 0,
  aciklama TEXT
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_ode_tarih ON okul_disi_etkinlikler(etkinlik_tarihi DESC);
CREATE INDEX IF NOT EXISTS idx_ode_sinif ON okul_disi_etkinlikler(sinif_key);
CREATE INDEX IF NOT EXISTS idx_ode_ogretmen ON okul_disi_etkinlikler(ogretmen_adi);

-- RLS
ALTER TABLE okul_disi_etkinlikler ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon on okul_disi_etkinlikler" ON okul_disi_etkinlikler;
CREATE POLICY "Allow all for anon on okul_disi_etkinlikler" ON okul_disi_etkinlikler FOR ALL TO anon USING (true) WITH CHECK (true);
