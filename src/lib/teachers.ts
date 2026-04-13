import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { getSinifSubeList } from '@/lib/data';
import { loadTeachersFromStore, saveTeachersToStore } from './teachersStore';

// Type definitions
interface TeacherData {
  [key: string]: unknown;
}

export interface TeacherRecord {
  teacherId: string; // derived if not present
  teacherName: string;
  teacherNameNormalized: string;
  sinifSubeKey: string; // e.g. "1#A"
  sinifSubeDisplay: string; // e.g. "1. Sınıf / A Şubesi"
}

function normalizeTr(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/[^a-z0-9çğıöşü\s]/gi, ' ') // keep turkish chars
    .replace(/\s+/g, ' ') // collapse spaces
    .trim();
}

export function resolveKeyFromDisplay(display: string): string | null {
  // Prefer exact match with data.json's Sinif_Sube
  try {
    const list = getSinifSubeList();
    const byText = list.find(s => s.text.trim().toLocaleLowerCase('tr-TR') === display.trim().toLocaleLowerCase('tr-TR'));
    if (byText) return byText.value;
  } catch {}
  // Fallback regex (rarely used, may not match data.json ids)
  const match = display.match(/(\d+)\.?\s*Sınıf\s*\/\s*([A-ZÇĞİÖŞÜ])/i);
  if (match) {
    return `${match[1]}#${match[2].toUpperCase()}`;
  }
  return null;
}

export async function loadTeachersFromExcel(): Promise<TeacherRecord[]> {
  const filePath = path.join(process.cwd(), 'teachers.xlsx');
  if (!fs.existsSync(filePath)) {
    return [];
  }

  let rows: TeacherData[] = [];
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.worksheets[0];
    if (!sheet) return [];

    // Header satırını oku
    const headerRow = sheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = String(cell.value || '');
    });

    // Veri satırlarını oku
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // header'ı atla
      const rowData: TeacherData = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber];
        if (header) {
          rowData[header] = cell.value ?? '';
        }
      });
      rows.push(rowData);
    });
  } catch (err) {
    console.warn(`teachers.xlsx okunamadı: ${String(err)}`);
    return [];
  }

  // Tahmini kolon adları: "Sınıf/Şube" veya benzeri, "Öğretmen"
  return rows
    .map((r, idx): TeacherRecord | null => {
      const teacherName = String(r.Öğretmen || r.Ogretmen || r['Öğretmen Adı'] || r['Öğretmen Adı Soyadı'] || r.teacher || r.name || '').trim();
      const sinifDisplay = String(r['Sınıf/Şube'] || r['Sinif/Sube'] || r['Sınıf'] || r['Sinif'] || '').trim();
      const sinifSubeDisplay = sinifDisplay || String(r['Sınıf Adı'] || r['Sınıf - Şube'] || '').trim();
      if (!teacherName || !sinifSubeDisplay) return null;
      const teacherId = `t${idx + 1}`;
      const key = resolveKeyFromDisplay(sinifSubeDisplay) || sinifSubeDisplay;
      return {
        teacherId,
        teacherName,
        teacherNameNormalized: normalizeTr(teacherName),
        sinifSubeKey: key,
        sinifSubeDisplay,
      };
    })
    .filter(Boolean) as TeacherRecord[];
}

function buildTeacherIndex(records: TeacherRecord[]) {
  const byName = new Map<string, TeacherRecord>();
  const byKey = new Map<string, TeacherRecord>();
  for (const r of records) {
    byName.set(r.teacherNameNormalized, r);
    byKey.set(r.sinifSubeKey, r);
  }
  return { byName, byKey };
}

export function matchTeacherByName(name: string, records: TeacherRecord[]): TeacherRecord | null {
  const norm = normalizeTr(name);
  const { byName } = buildTeacherIndex(records);
  return byName.get(norm) || null;
}

export function validateTeacherClass(teacherName: string, sinifSubeKey: string, records: TeacherRecord[]): { valid: boolean; message?: string; teacher?: TeacherRecord } {
  const teacher = matchTeacherByName(teacherName, records);
  if (!teacher) {
    return { valid: false, message: `Öğretmen bulunamadı: ${teacherName}` };
  }
  if (teacher.sinifSubeKey !== sinifSubeKey) {
    return {
      valid: false,
      message: `Hatalı sınıf/şube seçtiniz. ${teacher.teacherName} yalnızca ${teacher.sinifSubeDisplay} öğretmenidir.`,
      teacher,
    };
  }
  return { valid: true, teacher };
}

export function listTeachersForUI(records: TeacherRecord[]) {
  return records.map(r => ({ value: r.teacherName, label: r.teacherName, sinifSubeKey: r.sinifSubeKey, sinifSubeDisplay: r.sinifSubeDisplay }));
}

export async function getTeachersData() {
  // Prefer cached store for speed
  let records = loadTeachersFromStore();
  if (!records || records.length === 0) {
    // Try to import from Excel
    records = await loadTeachersFromExcel();
    if (records.length > 0) {
      try { saveTeachersToStore(records); } catch {}
    }
  }
  return { records, list: listTeachersForUI(records) };
}

export async function importTeachersFromExcelToStore() {
  const records = await loadTeachersFromExcel();
  if (records.length > 0) saveTeachersToStore(records);
  return records.length;
}
