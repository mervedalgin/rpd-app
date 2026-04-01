-- =============================================
-- RPD App - RLS Politikalarını Güçlendir
-- =============================================
-- Mevcut permissive anon politikalarını kaldırıp
-- service_role ile erişimi kısıtlar.
-- API route'lar Supabase service_role key kullanır.
-- Uygulama tarihi: 2026-04-02

-- Önce RLS kapalı tablolarda RLS'yi aç
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_summaries ENABLE ROW LEVEL SECURITY;

-- 1. referrals
DROP POLICY IF EXISTS "Allow all for anon referrals" ON referrals;
CREATE POLICY "Service role full access referrals" ON referrals
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon read only referrals" ON referrals
  FOR SELECT TO anon USING (true);

-- 2. discipline_records
DROP POLICY IF EXISTS "Allow all for anon discipline_records" ON discipline_records;
CREATE POLICY "Service role full access discipline_records" ON discipline_records
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon read only discipline_records" ON discipline_records
  FOR SELECT TO anon USING (true);

-- 3. class_students
DROP POLICY IF EXISTS "Allow all for anon class_students" ON class_students;
CREATE POLICY "Service role full access class_students" ON class_students
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon read only class_students" ON class_students
  FOR SELECT TO anon USING (true);

-- 4. telegram_summaries
DROP POLICY IF EXISTS "Allow all for anon telegram_summaries" ON telegram_summaries;
CREATE POLICY "Service role full access telegram_summaries" ON telegram_summaries
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon read only telegram_summaries" ON telegram_summaries
  FOR SELECT TO anon USING (true);

-- 5. appointments
DROP POLICY IF EXISTS "Allow all for anon appointments" ON appointments;
CREATE POLICY "Service role full access appointments" ON appointments
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon read only appointments" ON appointments
  FOR SELECT TO anon USING (true);

-- 6. tasks
DROP POLICY IF EXISTS "Allow all for anon tasks" ON tasks;
CREATE POLICY "Service role full access tasks" ON tasks
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon read only tasks" ON tasks
  FOR SELECT TO anon USING (true);

-- 7. case_notes
DROP POLICY IF EXISTS "Allow all for anon case_notes" ON case_notes;
CREATE POLICY "Service role full access case_notes" ON case_notes
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon read only case_notes" ON case_notes
  FOR SELECT TO anon USING (true);

-- 8. risk_students (NO anon read - sensitive data)
DROP POLICY IF EXISTS "Allow all for anon risk_students" ON risk_students;
CREATE POLICY "Service role full access risk_students" ON risk_students
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 9. follow_ups
DROP POLICY IF EXISTS "Allow all for anon follow_ups" ON follow_ups;
CREATE POLICY "Service role full access follow_ups" ON follow_ups
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon read only follow_ups" ON follow_ups
  FOR SELECT TO anon USING (true);

-- 10. ram_referrals
DROP POLICY IF EXISTS "Allow all for anon ram_referrals" ON ram_referrals;
CREATE POLICY "Service role full access ram_referrals" ON ram_referrals
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon read only ram_referrals" ON ram_referrals
  FOR SELECT TO anon USING (true);

-- 11. class_activities
DROP POLICY IF EXISTS "Allow all for anon class_activities" ON class_activities;
CREATE POLICY "Service role full access class_activities" ON class_activities
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon read only class_activities" ON class_activities
  FOR SELECT TO anon USING (true);

-- 12. class_observations
DROP POLICY IF EXISTS "Allow all for anon class_observations" ON class_observations;
CREATE POLICY "Service role full access class_observations" ON class_observations
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon read only class_observations" ON class_observations
  FOR SELECT TO anon USING (true);

-- 13. sociometry
DROP POLICY IF EXISTS "Allow all for anon sociometry" ON sociometry;
CREATE POLICY "Service role full access sociometry" ON sociometry
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon read only sociometry" ON sociometry
  FOR SELECT TO anon USING (true);

-- 14. goals
DROP POLICY IF EXISTS "Allow all for anon goals" ON goals;
CREATE POLICY "Service role full access goals" ON goals
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon read only goals" ON goals
  FOR SELECT TO anon USING (true);

-- 15. parent_contacts (NO anon read - PII)
DROP POLICY IF EXISTS "Allow all for anon parent_contacts" ON parent_contacts;
CREATE POLICY "Service role full access parent_contacts" ON parent_contacts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 16. settings
DROP POLICY IF EXISTS "Allow all for anon settings" ON settings;
CREATE POLICY "Service role full access settings" ON settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon read only settings" ON settings
  FOR SELECT TO anon USING (true);

-- 17. appointment_reports
DROP POLICY IF EXISTS "Allow all for anon appointment_reports" ON appointment_reports;
CREATE POLICY "Service role full access appointment_reports" ON appointment_reports
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon read only appointment_reports" ON appointment_reports
  FOR SELECT TO anon USING (true);

-- 18. daily_jsons
DROP POLICY IF EXISTS "Allow all for anon daily_jsons" ON daily_jsons;
CREATE POLICY "Service role full access daily_jsons" ON daily_jsons
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon read only daily_jsons" ON daily_jsons
  FOR SELECT TO anon USING (true);
