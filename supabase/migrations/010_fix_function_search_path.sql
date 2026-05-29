-- 010_fix_function_search_path.sql
-- Supabase güvenlik danışmanı (lint 0011) uyarısının giderilmesi:
-- "Function Search Path Mutable". search_path sabitlenmemiş SECURITY DEFINER /
-- trigger fonksiyonları, arama yolu manipülasyonuna açıktır. Aşağıdaki iki
-- trigger fonksiyonunun search_path'ini boş bir değere sabitliyoruz; bu,
-- davranışı değiştirmez (zaten şemasız nesneye dokunmuyorlar) ama uyarıyı kapatır.
-- Ref: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

ALTER FUNCTION public.update_appointments_updated_at() SET search_path = '';
ALTER FUNCTION public.update_tutanak_timestamp() SET search_path = '';
