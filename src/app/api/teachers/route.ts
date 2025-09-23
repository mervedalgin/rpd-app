import { NextRequest, NextResponse } from 'next/server';
import { getTeachersData, matchTeacherByName, importTeachersFromExcelToStore } from '@/lib/teachers';
import { seedTeachers } from '@/lib/seedTeachers';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { records, list } = getTeachersData();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    if (q) {
      const m = matchTeacherByName(q, records);
      if (!m) return NextResponse.json({ found: false });
      return NextResponse.json({ found: true, teacher: m });
    }
    return NextResponse.json({ teachers: list });
  } catch (error) {
    console.error('Teachers API Error:', error);
    return NextResponse.json({ error: 'Öğretmen verileri yüklenemedi' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();
    if (action === 'import') {
      const count = importTeachersFromExcelToStore();
      return NextResponse.json({ imported: count });
    }
    if (action === 'seed') {
      const count = seedTeachers();
      return NextResponse.json({ seeded: count, message: `${count} öğretmen verisi DB'ye yazıldı` });
    }
    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    console.error('Teachers API POST Error:', error);
    return NextResponse.json({ error: 'İşlem başarısız' }, { status: 500 });
  }
}
