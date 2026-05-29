// Cron uçları için opsiyonel doğrulama.
//
// Vercel Cron, CRON_SECRET ortam değişkeni ayarlandığında istekleri
// `Authorization: Bearer <CRON_SECRET>` başlığıyla gönderir. Bu helper:
//   - CRON_SECRET TANIMLIYSA -> başlığı zorunlu kılar (yetkisiz çağrıları engeller)
//   - CRON_SECRET tanımlı DEĞİLSE -> mevcut davranışı korur (açık)
// Böylece guard eklemek mevcut zamanlanmış işleri kırmaz; güvenliği aktive etmek
// için yalnızca CRON_SECRET ayarlanması yeterlidir.
export function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // yapılandırılmamışsa engelleme
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
