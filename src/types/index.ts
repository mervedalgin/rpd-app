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