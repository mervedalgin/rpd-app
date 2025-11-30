import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

// Bu endpoint Supabase "class_students" tablosu üzerinden
// sınıf bazlı öğrenci listeleme, ekleme ve silme işlemlerini yönetir.

export async function GET(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase configuration missing' },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const classKey = searchParams.get('classKey');

    if (!classKey) {
      return NextResponse.json(
        { error: 'classKey parametresi gerekli' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('class_students')
      .select('*')
      .eq('class_key', classKey)
      .order('student_name', { ascending: true });

    if (error) {
      console.error('Supabase class_students GET error:', error.message);
      return NextResponse.json(
        { error: 'Öğrenciler alınırken hata oluştu' },
        { status: 500 }
      );
    }

    return NextResponse.json({ students: data ?? [] });
  } catch (err) {
    console.error('Class students GET error:', err);
    return NextResponse.json(
      { error: 'Beklenmeyen hata oluştu' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase configuration missing' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { classKey, classDisplay, studentName, studentNumber } = body as {
      classKey?: string;
      classDisplay?: string;
      studentName?: string;
      studentNumber?: string;
    };

    if (!classKey || !studentName) {
      return NextResponse.json(
        { error: 'classKey ve studentName zorunludur' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('class_students')
      .insert({
        class_key: classKey,
        class_display: classDisplay ?? classKey,
        student_name: studentName,
        student_number: studentNumber ?? null,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Supabase class_students POST error:', error.message);
      return NextResponse.json(
        { error: 'Öğrenci eklenirken hata oluştu' },
        { status: 500 }
      );
    }

    return NextResponse.json({ student: data }, { status: 201 });
  } catch (err) {
    console.error('Class students POST error:', err);
    return NextResponse.json(
      { error: 'Beklenmeyen hata oluştu' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase configuration missing' },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id parametresi gerekli' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('class_students')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase class_students DELETE error:', error.message);
      return NextResponse.json(
        { error: 'Öğrenci silinirken hata oluştu' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Class students DELETE error:', err);
    return NextResponse.json(
      { error: 'Beklenmeyen hata oluştu' },
      { status: 500 }
    );
  }
}
