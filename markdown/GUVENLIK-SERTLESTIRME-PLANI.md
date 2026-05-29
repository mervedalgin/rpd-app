# RPD App — Güvenlik Sertleştirme Planı

**Tarih:** 2026-05-29
**Hazırlayan:** analiz takımı + canlı Supabase/git incelemesi
**Hedef:** Kimliksiz veri erişimini kapatmak (KVKK), canlı uygulamayı kırmadan.

> ✅ **DURUM: Faz 0–5 UYGULANDI (2026-05-29).** Tüm anon RLS politikaları kaldırıldı
> (`pg_policies`'te 0 anon politikası), 13 client sayfası oturum-korumalı API'ye
> geçirildi, `proxy.ts` panel_session doğruluyor, `npm run build` ve `tsc` yeşil.
> Kalan tek manuel iş: Supabase dashboard'dan leaked-password + MFA (app Supabase
> Auth kullanmadığı için düşük öncelik) ve rate limit'in kalıcılaştırılması.

---

## Sorunun özeti

İki paralel **kimliksiz** veri erişim yolu var:

1. **İstemci → Supabase anon key.** 13 client sayfası 12 tabloya doğrudan
   `supabase.from()` ile CRUD yapıyor. Supabase advisor: ~20 tabloda
   `anon` rolüne `USING(true)/WITH CHECK(true)` **FOR ALL** politikası açık.
   Anon key JS bundle'ında herkese açık → tüm öğrenci PII'si dışarıdan
   okunabilir/silinebilir.
2. **API route'ları → service_role**, ama 22 route'tan sadece 3'ü auth içeriyor;
   `middleware.ts` yok → doğrudan `/api/students` çağrısıyla aşılır.

### Neden migration 007/009 çözmedi
RLS'te **permissive** politikalar OR'lanır. 009, hassas tablolara
`service_role`-only bir **SELECT** politikası ekledi ama orijinal
`"Allow all operations for anon"` **FOR ALL true** politikasını DROP etmedi.
FOR-ALL true hâlâ her şeyi açıyor. → Yarı-uygulanmış, çelişkili durum.

### De-risking bulgusu
Login (`POST /api/panel-auth`) zaten httpOnly `panel_session` cookie'si kuruyor
ve bu cookie same-origin tüm `/api/*` isteklerine otomatik gidiyor
(`layout.tsx:367`). Yani **middleware eklemek mevcut panel kullanıcısını kırmaz.**

---

## Etkilenen tablolar ve sayfalar

| Tablo | Client sayfa | Mevcut API route? |
|---|---|---|
| `referrals` | (api üzerinden + bazı direct) | ✅ student-history / stats |
| `appointments` | randevu | ✅ appointments |
| `discipline_records` | (direct) | ✅ discipline |
| `tasks` | yapilacaklar | ❌ yeni gerekli |
| `follow_ups` | takip-hatirlaticilar | ❌ yeni gerekli |
| `parent_contacts` | veli-iletisim | ❌ yeni gerekli |
| `ram_referrals` | ram-yonlendirme | ❌ yeni gerekli |
| `case_notes` | vaka-dosyalari | ❌ yeni gerekli |
| `class_activities` | sinif-etkinlikleri | ❌ yeni gerekli |
| `risk_students` | risk-takip | kısmen risk-detection |
| `okul_disi_etkinlikler` | okul-disi-etkinlik | ❌ yeni gerekli |
| `settings` | ayarlar | ❌ yeni gerekli |

---

## Fazlar (artımlı, her faz kendi başına geri alınabilir)

### Faz 0 — Keşif & yedek *(0.5 gün, risksiz)*
- `execute_sql` ile `pg_policies`'ten tüm public tablo politikalarını dök →
  gerçek durum tablosu (advisor + kod beklentisi ile karşılaştır).
- Supabase'de PITR/yedek noktası teyit et veya manuel snapshot.
- (Tamamlandı) Login akışı doğrulandı: cookie güvenilir şekilde set ediliyor.

### Faz 1 — Server-side auth altyapısı *(0.5 gün, düşük risk)*
- `verifySessionCookie`'yi `panel-auth/route.ts`'ten `src/lib/auth.ts`'e taşı
  (paylaşılabilir hale getir).
- `src/middleware.ts`: `/api/*` için `panel_session` doğrula.
  **İstisnalar:** `/api/panel-auth` (login), `/api/cron/*` (CRON_SECRET ile),
  `/api/telegram-*` (kendi secret'ı), `/api/config-check`. `matcher` ile sınırla.
- Önce **log-only** (enforce etmeden) deploy → trafikte beklenmedik 401 var mı
  gözlemle → sonra enforce'a çevir.
- Test: panelde normal kullanım çalışır; `curl /api/students` (cookie'siz) → 401.
- **Risk:** cron/telegram istisnaları yanlışsa zamanlanmış işler kırılır →
  matcher'ı dikkatli yaz, log-only fazında doğrula. **Rollback:** middleware sil.

### Faz 2 — Eksik API route'ları *(1–2 gün, additive, kırılma yok)*
- Yeni route'lar: `tasks`, `follow_ups`, `parent_contacts`, `ram_referrals`,
  `case_notes`, `class_activities`, `risk_students`, `settings`,
  `okul_disi_etkinlikler`. Her biri `appointments/route.ts` kalıbı:
  GET/POST/PUT/DELETE + `validateBody` + tutarlı hata + service_role.
- **Önerilen birleşik kazanım (K7):** fetch-tabanlı ortak `useCrudResource<T>`
  hook'u → 6 sayfadaki kopya CRUD iskeletini de tek yere indirir.
- Bu fazda client hâlâ anon kullanıyor; yeni route'lar henüz devrede değil.

### Faz 3 — Client'ı API'ye geçir *(2–3 gün, sayfa sayfa izole)*
- 13 sayfada `supabase.from()` → `fetch('/api/...')`. **Sayfa sayfa**, her birini
  ayrı test ederek, ayrı commit'le. Tamamlanınca `src/lib/supabase.ts` (anon
  client) tamamen kaldırılabilir.
- **Risk:** sayfa başına davranış farkı → izole commit + manuel test ile sınırlı.

### Faz 4 — RLS kilitleme *(0.5 gün, EN RİSKLİ — en sona)*
- Hassas tablolarda kalan `"Allow all operations for anon"` FOR ALL true
  politikalarını DROP et; sadece `service_role` FOR ALL bırak.
- **Faz 3 bitmeden YAPMA** (yoksa client anon erişimi kırılır).
- Önce Supabase **branch** üzerinde test et, sonra prod'a merge.
- Doğrulama: `get_advisors(security)` → 0 "always true" uyarısı.
- **Rollback:** politikaları geri ekleyen ters migration hazır tut.

### Faz 5 — Ek sertleştirme *(0.5 gün)*
- Supabase Auth: **leaked password protection** + **MFA** aç (advisor uyarıları).
- `panel-auth` rate limit'i şu an **in-memory** (serverless'te instance başına,
  etkisiz) → Supabase tablosu veya Upstash ile kalıcılaştır.
- (Yapıldı) Fonksiyon `search_path` sabitleme — migration 010.

---

## Önerilen sıra ve toplam efor
Faz 0 → 1 → 2 → 3 → 4 → 5. Kabaca **5–8 gün**. Faz 1 tek başına bile ikinci
savunma hattını kurar (API'yi kimliksiz erişime kapatır); en yüksek risk Faz 4'te
ve en sona bırakıldı.

## Bu oturumda zaten yapılanlar
- `supabase.ts` sessiz null-deref → net hata (Proxy).
- `stats` + `student-history` route'ları kolon-select + stats cache.
- `ogrenci-gecmisi` loadHistory `Promise.all`.
- Fonksiyon `search_path` sabitleme (migration 010, **uygulandı**).
