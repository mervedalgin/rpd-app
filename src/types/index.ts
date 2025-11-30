export interface SinifSube {
  value: string;
  text: string;
}

export interface Ogrenci {
  value: string;
  text: string;
}

export interface StudentData {
  Sinif_Sube: SinifSube[];
  [key: string]: SinifSube[] | Ogrenci[];
}

export interface YonlendirmeFormu {
  ogretmenAdi: string;
  sinifSube: string;
  ogrenciler: string[];
  yonlendirmeNedeni: string;
}

export interface YonlendirilenOgrenci {
  id: string;
  ogretmenAdi: string;
  sinifSube: string;
  ogrenciAdi: string;
  yonlendirmeNedeni: string;
  not?: string;
  tarih: string;
}

// Supabase referrals tablosu için temel tip
export interface ReferralRecord {
  id?: string;
  created_at?: string;
  teacher_name: string;
  class_key: string;
  class_display: string;
  student_name: string;
  reason: string;
  note?: string | null;
  source?: string;
}

export const YONLENDIRME_NEDENLERI = [
  "Akran Zorbalığı Yapan",
  "Özel Gereksinimli",
  "Devamsızlık Yapan", 
  "Sınıf Kurallarına Uymayan",
  "Öksüz/Yetim",
  "Ailevi Travması Olan",
  "Maddi Durumu Yetersiz",
  "Göçmen / Mülteci (Suriyeli)",
  "RAM'a yönlendirilmesi gereken"
] as const;

export type YonlendirmeNedeni = typeof YONLENDIRME_NEDENLERI[number];

// Disiplin Ceza Türleri
export const DISIPLIN_CEZALARI = [
  "Sözlü Uyarı",
  "Öğrenci Sözleşmesi İmzalama",
  "Kınama",
  "Okul Değişikliği Talebi"
] as const;

export type DisiplinCezasi = typeof DISIPLIN_CEZALARI[number];

// Disiplin kaydı için tip
export interface DisiplinRecord {
  id?: string;
  created_at?: string;
  student_id: string;
  student_name: string;
  class_key: string;
  class_display: string;
  event_date: string;
  reason: string;
  penalty_type: DisiplinCezasi;
  notes?: string | null;
}