/**
 * MEBBİS Aşama Eşleştirme Modülü
 *
 * Yönlendirme nedeni ve notuna göre dinamik olarak
 * hizmet_turu, asama1, asama2, asama3 değerlerini belirler.
 *
 * Hiyerarşi: hizmet_turu → asama1 → asama2 → asama3
 */

export interface MebbisAsama {
  hizmet_turu: string;
  asama1: string;
  asama2: string;
  asama3: string;
}

// ─── Varsayılan (fallback) değerler ───
const DEFAULT_ASAMA: MebbisAsama = {
  hizmet_turu: "5",  // Ö - Gelişimsel ve Önleyici
  asama1: "12",      // ÖOV - Bilgi Verme
  asama2: "14",      // ÖOVK - Sosyal Duygusal Gelişim
  asama3: "35",      // Varsayılan
};

// ─── Neden → Temel aşama eşleştirmesi ───
// Her yönlendirme nedeni bir MEBBİS hizmet dalına karşılık gelir
const REASON_BASE_MAP: Record<string, MebbisAsama> = {
  // ═══ Ö - GELİŞİMSEL VE ÖNLEYİCİ HİZMETLER (5) ═══
  "Rehberliğe İhtiyaç Duyan": {
    hizmet_turu: "5",
    asama1: "12",  // ÖOV - Bilgi Verme
    asama2: "14",  // ÖOVK - Sosyal Duygusal Gelişim
    asama3: "35",  // Varsayılan - nota göre değişecek
  },
  "Devamsızlık Yapan": {
    hizmet_turu: "5",
    asama1: "12",  // ÖOV - Bilgi Verme
    asama2: "15",  // ÖOVE - Akademik Gelişim
    asama3: "54",  // ÖOVEb - Devamsızlık Nedenleri
  },

  // ═══ İ - İYİLEŞTİRİCİ HİZMETLER (6) ═══
  "Psikolojik Danışmaya İhtiyaç Duyan": {
    hizmet_turu: "6",
    asama1: "17",  // İB - Bireysel Psikolojik Danışma
    asama2: "75",  // İB - Psikolojik Uyum
    asama3: "",    // İB dalında asama3 yok
  },
  "Akran Zorbalığı Yapan": {
    hizmet_turu: "6",
    asama1: "17",  // İB - Bireysel Psikolojik Danışma
    asama2: "76",  // İB - Davranış Sorunları
    asama3: "",
  },
  "Sınıf Kurallarına Uymayan": {
    hizmet_turu: "6",
    asama1: "17",  // İB - Bireysel Psikolojik Danışma
    asama2: "76",  // İB - Davranış Sorunları
    asama3: "",
  },
  "Ailevi Travması Olan": {
    hizmet_turu: "6",
    asama1: "17",  // İB - Bireysel Psikolojik Danışma
    asama2: "71",  // İB - Aile
    asama3: "",
  },
  "Öksüz/Yetim": {
    hizmet_turu: "6",
    asama1: "17",  // İB - Bireysel Psikolojik Danışma
    asama2: "71",  // İB - Aile
    asama3: "",
  },
  "Maddi Durumu Yetersiz": {
    hizmet_turu: "6",
    asama1: "17",  // İB - Bireysel Psikolojik Danışma
    asama2: "77",  // İB - Sosyoekonomik Konular
    asama3: "",
  },
  "Göçmen / Mülteci (Suriyeli)": {
    hizmet_turu: "6",
    asama1: "17",  // İB - Bireysel Psikolojik Danışma
    asama2: "73",  // İB - Okula Ve Çevreye Uyum
    asama3: "",
  },
  "Özel Gereksinimli": {
    hizmet_turu: "6",
    asama1: "19",  // İS - Sevk (Yönlendirme)
    asama2: "91",  // İS - RAM'a Yönlendirme
    asama3: "",
  },
  "RAM'a yönlendirilmesi gereken": {
    hizmet_turu: "6",
    asama1: "19",  // İS - Sevk (Yönlendirme)
    asama2: "91",  // İS - RAM'a Yönlendirme
    asama3: "",
  },

  // ═══ D - DESTEK HİZMETLER (7) ═══
  "Aile Görüşmesine İhtiyaç Duyan": {
    hizmet_turu: "7",
    asama1: "20",  // DM - Müşavirlik
    asama2: "21",  // DMV - Veliye Yönelik
    asama3: "",
  },
};

// ─── Not anahtar kelimesi → asama3 eşleştirmesi ───
// "Rehberliğe İhtiyaç Duyan" gibi genel nedenler için
// not (note) kısmındaki anahtar kelimeler asama3'ü belirler
//
// Bu eşleştirme sadece hizmet_turu=5 (Önleyici) dalı için geçerli
// çünkü asama3 detayları bu dalda tanımlı
interface NoteKeywordRule {
  keywords: string[];
  asama2: string;   // Eşleşince asama2'yi de değiştirebilir
  asama3: string;
  label: string;     // Debug/log için açıklama
}

const NOTE_KEYWORD_RULES: NoteKeywordRule[] = [
  // ── ÖOVE - Akademik Gelişim (asama2: 15) ──
  { keywords: ["okula uyum", "uyum sorunu", "çevreye uyum", "adaptasyon"],
    asama2: "15", asama3: "681", label: "ÖOVEb - Okula ve Çevreye Uyum" },
  { keywords: ["devamsızlık", "devamsız", "okula gelmeme"],
    asama2: "15", asama3: "54", label: "ÖOVEb - Devamsızlık Nedenleri" },
  { keywords: ["devamsızlığı önleme", "devamsızlık önleme"],
    asama2: "15", asama3: "368", label: "ÖOVEb - Devamsızlığı Önleme" },
  { keywords: ["başarısızlık", "başarısız", "not düşük"],
    asama2: "15", asama3: "53", label: "ÖOVEb - Başarısızlık Nedenleri" },
  { keywords: ["ders seçimi", "ders seçim", "alan seçimi"],
    asama2: "15", asama3: "50", label: "ÖOVEb - Ders Seçimi" },
  { keywords: ["motivasyon", "isteksiz", "motive"],
    asama2: "15", asama3: "364", label: "ÖOVEb - Motivasyon" },
  { keywords: ["sınav kaygı", "kaygı", "sınav stresi"],
    asama2: "15", asama3: "49", label: "ÖOVEb - Sınav Kaygısı" },
  { keywords: ["çalışma programı", "program hazırlama"],
    asama2: "15", asama3: "365", label: "ÖOVEb - Çalışma Programı Hazırlama" },
  { keywords: ["dikkat", "dikkat eksikliği", "konsantrasyon"],
    asama2: "15", asama3: "366", label: "ÖOVEb - Dikkat Geliştirme" },
  { keywords: ["hedef", "hedef belirleme"],
    asama2: "15", asama3: "362", label: "ÖOVEb - Hedef Belirleme" },
  { keywords: ["verimli ders", "ders çalışma", "çalışma yöntemi"],
    asama2: "15", asama3: "44", label: "ÖOVEb - Verimli Ders Çalışma" },
  { keywords: ["kural", "okul kuralı", "kurallar"],
    asama2: "15", asama3: "40", label: "ÖOVEb - Okul Kuralları" },
  { keywords: ["öz disiplin", "disiplin geliştirme"],
    asama2: "15", asama3: "363", label: "ÖOVEb - Öz Disiplin Geliştirme" },
  { keywords: ["zaman yönetimi", "zaman"],
    asama2: "15", asama3: "45", label: "ÖOVEb - Zamanı Yönetimi" },
  { keywords: ["sınav başarı", "sınav stratejisi"],
    asama2: "15", asama3: "48", label: "ÖOVEb - Sınavda Başarılı Olma Stratejileri" },
  { keywords: ["öğrenme stili", "öğrenme"],
    asama2: "15", asama3: "47", label: "ÖOVEb - Öğrenme Stilleri" },
  { keywords: ["serbest zaman", "boş zaman"],
    asama2: "15", asama3: "46", label: "ÖOVEb - Serbest Zamanı Değerlendirme" },
  { keywords: ["kulüp", "sosyal kulüp"],
    asama2: "15", asama3: "43", label: "ÖOVEb - Sosyal Kulüpler" },
  { keywords: ["rehberlik tanıtım", "servis tanıtım", "rpd tanıtım"],
    asama2: "15", asama3: "42", label: "ÖOVEb - RPD Servisinin Tanıtılması" },

  // ── İB (İyileştirici) nota göre asama2 refinement ──
  // Bu kurallar hizmet_turu=6 olan nedenler için de çalışır
  { keywords: ["sosyal uyum", "arkadaşlık", "sosyal ilişki", "akran"],
    asama2: "74", asama3: "", label: "İB - Sosyal Uyum" },
  { keywords: ["psikolojik", "ruhsal", "depresyon", "anksiyete"],
    asama2: "75", asama3: "", label: "İB - Psikolojik Uyum" },
  { keywords: ["okula uyum", "çevreye uyum"],
    asama2: "73", asama3: "", label: "İB - Okula Ve Çevreye Uyum" },
  { keywords: ["sağlık", "hastalık", "tedavi"],
    asama2: "72", asama3: "", label: "İB - Sağlık" },
];

/**
 * Yönlendirme nedeni ve notuna göre MEBBİS aşamalarını belirler.
 *
 * Öncelik sırası:
 * 1. reason → REASON_BASE_MAP'ten temel aşamalar alınır
 * 2. note → NOTE_KEYWORD_RULES ile asama2/asama3 detaylandırılır
 * 3. Eşleşme yoksa DEFAULT_ASAMA kullanılır
 */
export function resolveAsama(reason: string, note?: string | null): MebbisAsama {
  // 1. Temel eşleştirme: reason → base values
  const base = REASON_BASE_MAP[reason];
  if (!base) {
    console.warn(`[mebbis-mapping] Bilinmeyen neden: "${reason}", varsayılan kullanılıyor`);
    return { ...DEFAULT_ASAMA };
  }

  const result = { ...base };

  // 2. Neden + not birleştirilerek anahtar kelime eşleştirmesi yapılır
  const combinedText = [reason, note].filter(Boolean).join(" ").toLowerCase().trim();

  if (combinedText) {
    // Sadece ilgili hizmet türü kurallarını uygula
    for (const rule of NOTE_KEYWORD_RULES) {
      const matched = rule.keywords.some(kw => combinedText.includes(kw.toLowerCase()));
      if (!matched) continue;

      // hizmet_turu=5 (Önleyici) ise asama2+asama3 güncelle
      if (result.hizmet_turu === "5") {
        result.asama2 = rule.asama2;
        result.asama3 = rule.asama3;
        break; // İlk eşleşme kazanır
      }

      // hizmet_turu=6, asama1=17 (İB) ise sadece asama2 güncelle
      if (result.hizmet_turu === "6" && result.asama1 === "17" && rule.asama3 === "") {
        result.asama2 = rule.asama2;
        break;
      }
    }
  }

  return result;
}

