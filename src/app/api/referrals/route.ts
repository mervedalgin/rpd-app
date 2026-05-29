import { createCrudHandlers } from "@/lib/api-crud";

export const runtime = "nodejs";

// referrals için genel liste/oluşturma (rapor sayfaları + risk-takip insert).
// Not: /api/student-history (öğrenci bazlı geçmiş) ve /api/stats (agregasyon)
// ayrıca referrals üzerinde çalışır; bu route ham liste/CRUD sağlar.
export const { GET, POST, PUT, DELETE } = createCrudHandlers("referrals");
