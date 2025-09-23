import { NextRequest, NextResponse } from 'next/server';
import { getSinifSubeList } from '@/lib/data';

export async function GET() {
  try {
    const sinifSubeList = getSinifSubeList();
    
    return NextResponse.json({
      sinifSubeList,
    });
  } catch (error) {
    console.error('Data API Error:', error);
    return NextResponse.json(
      { error: 'Veri yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}