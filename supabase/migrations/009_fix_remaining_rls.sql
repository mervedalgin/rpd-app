-- Migration 009: Fix remaining RLS policies
-- Tables created after migration 005/007 still have overly permissive anon access

-- 1. okul_disi_etkinlikler: Remove anon FOR ALL, add service_role full + anon read-only
DROP POLICY IF EXISTS "Allow all operations for anon" ON okul_disi_etkinlikler;
DROP POLICY IF EXISTS "anon_full_access" ON okul_disi_etkinlikler;

CREATE POLICY "service_role_full_access" ON okul_disi_etkinlikler
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "anon_read_only" ON okul_disi_etkinlikler
  FOR SELECT USING (auth.role() = 'anon');

-- 2. academic_tutanaks: Remove anon FOR ALL, add service_role full + anon read-only
DROP POLICY IF EXISTS "Allow all operations for anon" ON academic_tutanaks;
DROP POLICY IF EXISTS "anon_full_access" ON academic_tutanaks;
DROP POLICY IF EXISTS "Allow anon to select academic_tutanaks" ON academic_tutanaks;
DROP POLICY IF EXISTS "Allow anon to insert academic_tutanaks" ON academic_tutanaks;
DROP POLICY IF EXISTS "Allow anon to update academic_tutanaks" ON academic_tutanaks;
DROP POLICY IF EXISTS "Allow anon to delete academic_tutanaks" ON academic_tutanaks;

CREATE POLICY "service_role_full_access" ON academic_tutanaks
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "anon_read_only" ON academic_tutanaks
  FOR SELECT USING (auth.role() = 'anon');

-- 3. appointment_tasks: Remove anon FOR ALL, add service_role full + anon read-only
DROP POLICY IF EXISTS "Allow all operations for anon" ON appointment_tasks;
DROP POLICY IF EXISTS "anon_full_access" ON appointment_tasks;

CREATE POLICY "service_role_full_access" ON appointment_tasks
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "anon_read_only" ON appointment_tasks
  FOR SELECT USING (auth.role() = 'anon');

-- 4. appointment_templates: Remove anon FOR ALL, add service_role full + anon read-only
DROP POLICY IF EXISTS "Allow all operations for anon" ON appointment_templates;
DROP POLICY IF EXISTS "anon_full_access" ON appointment_templates;

CREATE POLICY "service_role_full_access" ON appointment_templates
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "anon_read_only" ON appointment_templates
  FOR SELECT USING (auth.role() = 'anon');

-- 5. Restrict anon SELECT on sensitive tables (PII data)
-- case_notes
DROP POLICY IF EXISTS "Allow anon to read case_notes" ON case_notes;
DROP POLICY IF EXISTS "anon_read_case_notes" ON case_notes;
CREATE POLICY "anon_no_read_case_notes" ON case_notes
  FOR SELECT USING (auth.role() = 'service_role');

-- discipline_records
DROP POLICY IF EXISTS "Allow anon to read discipline_records" ON discipline_records;
DROP POLICY IF EXISTS "anon_read_discipline_records" ON discipline_records;
CREATE POLICY "anon_no_read_discipline_records" ON discipline_records
  FOR SELECT USING (auth.role() = 'service_role');

-- ram_referrals
DROP POLICY IF EXISTS "Allow anon to read ram_referrals" ON ram_referrals;
DROP POLICY IF EXISTS "anon_read_ram_referrals" ON ram_referrals;
CREATE POLICY "anon_no_read_ram_referrals" ON ram_referrals
  FOR SELECT USING (auth.role() = 'service_role');
