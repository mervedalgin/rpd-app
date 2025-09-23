import { NextRequest, NextResponse } from 'next/server';
import { getOgrenciListBySinif } from '@/lib/data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sinifSube = searchParams.get('sinifSube');
    
    if (!sinifSube) {
      return NextResponse.json(
        { error: 'Sınıf/Şube parametresi gerekli' },
        { status: 400 }
      );
    }
    
    const ogrenciList = getOgrenciListBySinif(sinifSube);
    
    return NextResponse.json(ogrenciList);
  } catch (error) {
    console.error('Students API Error:', error);
    return NextResponse.json(
      { error: 'Öğrenci listesi yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}