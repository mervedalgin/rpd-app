-- =============================================
-- RLS Sıkılaştırma — Anon Read Kısıtlama
-- =============================================
-- Client-side'dan erişilmeyen hassas tablolarda
-- anon SELECT politikasını kaldır.
-- Bu tablolara sadece service_role (API routes) erişebilir.
-- Uygulama tarihi: 2026-04-04

-- sociometry (client-side erişim yok)
DROP POLICY IF EXISTS "Anon read only sociometry" ON sociometry;

-- class_observations (client-side erişim yok)
DROP POLICY IF EXISTS "Anon read only class_observations" ON class_observations;

-- appointment_reports (client-side erişim yok)
DROP POLICY IF EXISTS "Anon read only appointment_reports" ON appointment_reports;

-- telegram_summaries (sadece API route'lar kullanıyor)
DROP POLICY IF EXISTS "Anon read only telegram_summaries" ON telegram_summaries;

-- daily_jsons (sadece API route'lar kullanıyor)
DROP POLICY IF EXISTS "Anon read only daily_jsons" ON daily_jsons;
