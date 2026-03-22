import fs from 'fs';
import path from 'path';
import { StudentData, SinifSube, Ogrenci } from '@/types';

// In-memory cache to avoid reading file on every request
let cachedData: StudentData | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function loadStudentData(): StudentData {
  const now = Date.now();
  if (cachedData && now - cacheTimestamp < CACHE_TTL) {
    return cachedData;
  }

  const dataPath = path.join(process.cwd(), 'data.json');
  const jsonData = fs.readFileSync(dataPath, 'utf8');
  cachedData = JSON.parse(jsonData);
  cacheTimestamp = now;
  return cachedData!;
}

export function getSinifSubeList(): SinifSube[] {
  const data = loadStudentData();
  return data.Sinif_Sube;
}

export function getOgrenciListBySinif(sinifSube: string): Ogrenci[] {
  const data = loadStudentData();

  // Önce direkt eşleşme dene
  let sinifSubeText = data.Sinif_Sube.find(s => s.value === sinifSube)?.text;

  // Eğer bulunamadıysa, # karakteri eksik olabilir, pattern matching yap
  if (!sinifSubeText) {
    const matchedItem = data.Sinif_Sube.find(s => s.value.startsWith(sinifSube + '#'));
    if (matchedItem) {
      sinifSubeText = matchedItem.text;
    }
  }

  if (!sinifSubeText) {
    return [];
  }

  // "1. Sınıf / A Şubesi" formatını "Ogrenci_1. Sınıf _ A Şubesi" formatına çevir
  const key = `Ogrenci_${sinifSubeText.replace(" / ", " _ ")}`;

  const ogrenciList = data[key];
  if (Array.isArray(ogrenciList)) {
    return ogrenciList as Ogrenci[];
  }

  return [];
}

export function formatTelegramMessage(
  ogretmenAdi: string,
  ogrenciAdi: string,
  sinifSube: string,
  yonlendirmeNedeni: string
): string {
  const now = new Date();
  const tarih = now.toLocaleDateString('tr-TR');
  const saat = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  return `${tarih} ${saat}\nÖğretmen: ${ogretmenAdi}\nYönlendirilen Öğrenci: ${sinifSube} / ${ogrenciAdi}\nYönlendirilme Nedeni: ${yonlendirmeNedeni}`;
}
