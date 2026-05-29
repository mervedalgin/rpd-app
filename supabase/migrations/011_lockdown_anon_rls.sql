-- 011_lockdown_anon_rls.sql
-- =============================================================================
-- KRİTİK GÜVENLİK: anon rolünün tüm tablolardaki erişimini kaldır.
-- =============================================================================
-- Migration 005/007/009 sıkılaştırmayı denedi ama orijinal
-- "Allow all operations for anon" (FOR ALL, USING true / WITH CHECK true)
-- politikalarını DROP etmediği için tablolar anon anahtara tam açık kaldı
-- (RLS permissive politikaları OR'lanır). Bu migration o açık politikaları ve
-- artık kullanılmayan "Anon read only" SELECT politikalarını kaldırır.
--
-- Ön koşul: TÜM client sayfaları anon Supabase yerine oturum-korumalı /api/*
-- route'larını (service_role) kullanacak şekilde geçirildi. service_role RLS'i
-- BYPASS ettiği için bu politikaların kaldırılması API erişimini ETKİLEMEZ;
-- yalnızca herkese açık anon anahtarın doğrudan erişimini keser.
--
-- Geri alma: ters migration ile "anon FOR ALL true" politikaları yeniden
-- eklenebilir (önerilmez).

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'appointment_reports','appointments','case_notes','class_activities',
    'class_observations','class_students','daily_jsons','discipline_records',
    'follow_ups','goals','okul_disi_etkinlikler','parent_contacts',
    'ram_referrals','referrals','risk_students','settings','sociometry',
    'tasks','telegram_summaries','academic_tutanaks','appointment_tasks',
    'appointment_templates'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Sadece var olan tablolar (bazı tablolar henüz oluşturulmamış olabilir)
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      -- anon "tam erişim" açık politikaları
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Allow all operations for anon', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'anon_full_access', t);
      -- artık kullanılmayan anon read-only SELECT politikaları
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', format('Anon read only %s', t), t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'anon_read_only', t);
    END IF;
  END LOOP;

  -- Tekil / özel adlı politikalar
  EXECUTE 'DROP POLICY IF EXISTS "Allow anon full access on academic_tutanaks" ON public.academic_tutanaks';
  EXECUTE 'DROP POLICY IF EXISTS "Enable all access for appointment_reports" ON public.appointment_reports';
END $$;

-- academic_tutanaks'ta hiç politika kalmadığı için (RLS açık, politika yok)
-- tutarlılık adına açık bir service_role politikası ekle. (service_role zaten
-- RLS'i bypass eder; bu yalnızca linter INFO'sunu giderir ve niyeti belgeler.)
DO $$
BEGIN
  IF to_regclass('public.academic_tutanaks') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname='public' AND tablename='academic_tutanaks'
         AND policyname='Service role full access academic_tutanaks'
     ) THEN
    EXECUTE 'CREATE POLICY "Service role full access academic_tutanaks" ON public.academic_tutanaks FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')';
  END IF;
END $$;

-- Not: Diğer tablolarda zaten "Service role full access ..." politikası mevcut ve
-- service_role RLS'i bypass eder; ek service_role politikası gerekmez.
