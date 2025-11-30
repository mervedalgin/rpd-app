import { NextRequest, NextResponse } from 'next/server';
import { getOgrenciListBySinif } from '@/lib/data';
import { supabase } from '@/lib/supabase';

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
    
    // 1. data.json'dan gelen öğrenciler
    const jsonOgrenciList = getOgrenciListBySinif(sinifSube);
    
    // 2. Supabase class_students tablosundan gelen öğrenciler
    let supabaseOgrenciList: { value: string; text: string }[] = [];
    
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('class_students')
          .select('id, student_number, student_name')
          .eq('class_key', sinifSube)
          .order('student_name', { ascending: true });
        
        if (!error && data) {
          supabaseOgrenciList = data.map((s) => ({
            // Supabase öğrencileri için unique value olarak 'supabase_' prefix'i kullan
            value: `supabase_${s.id}`,
            text: s.student_number ? `${s.student_number} ${s.student_name}` : s.student_name,
          }));
        }
      } catch (err) {
        console.error('Supabase students fetch error:', err);
        // Supabase hatası durumunda sadece JSON'dan devam et
      }
    }
    
    // 3. İki listeyi birleştir (önce JSON, sonra Supabase)
    // Aynı isimli öğrencileri filtrele (text bazlı)
    const existingTexts = new Set(jsonOgrenciList.map(o => o.text.toLowerCase()));
    const uniqueSupabaseList = supabaseOgrenciList.filter(
      s => !existingTexts.has(s.text.toLowerCase())
    );
    
    const mergedList = [...jsonOgrenciList, ...uniqueSupabaseList];
    
    return NextResponse.json(mergedList);
  } catch (error) {
    console.error('Students API Error:', error);
    return NextResponse.json(
      { error: 'Öğrenci listesi yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}