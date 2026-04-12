import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export const runtime = 'nodejs';

interface DetectedRisk {
  student_name: string;
  class_display: string;
  risk_score: number;
  risk_level: 'medium' | 'high' | 'critical';
  referral_count: number;
  discipline_count: number;
  total_records: number;
  last_record_date: string;
  top_reasons: string[];
}

export async function GET() {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase yapılandırması eksik' },
      { status: 500 }
    );
  }

  try {
    // Tüm yönlendirmeleri ve disiplin kayıtlarını çek
    const [refResult, discResult, existingRiskResult] = await Promise.all([
      supabase.from('referrals').select('student_name, class_display, reason, created_at'),
      supabase.from('discipline_records').select('student_name, class_display, reason, created_at'),
      supabase.from('risk_students').select('student_name, status'),
    ]);

    if (refResult.error) throw refResult.error;
    if (discResult.error) throw discResult.error;

    const referrals = refResult.data || [];
    const disciplines = discResult.data || [];

    // Zaten risk listesinde olan aktif öğrencileri bul
    const existingRiskNames = new Set(
      (existingRiskResult.data || [])
        .filter(r => r.status === 'active' || r.status === 'monitoring')
        .map(r => r.student_name.toLowerCase())
    );

    // Öğrenci bazında grupla
    const studentMap = new Map<string, {
      class_display: string;
      referral_count: number;
      discipline_count: number;
      reasons: string[];
      last_date: string;
    }>();

    for (const ref of referrals) {
      const name = ref.student_name?.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      const existing = studentMap.get(key) || {
        class_display: ref.class_display || '',
        referral_count: 0,
        discipline_count: 0,
        reasons: [] as string[],
        last_date: '',
      };
      existing.referral_count++;
      if (ref.class_display) existing.class_display = ref.class_display;
      if (ref.reason) existing.reasons.push(ref.reason);
      if (ref.created_at > existing.last_date) existing.last_date = ref.created_at;
      studentMap.set(key, existing);
    }

    for (const disc of disciplines) {
      const name = disc.student_name?.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      const existing = studentMap.get(key) || {
        class_display: disc.class_display || '',
        referral_count: 0,
        discipline_count: 0,
        reasons: [] as string[],
        last_date: '',
      };
      existing.discipline_count++;
      if (disc.class_display) existing.class_display = disc.class_display;
      if (disc.reason) existing.reasons.push(disc.reason);
      if (disc.created_at > existing.last_date) existing.last_date = disc.created_at;
      studentMap.set(key, existing);
    }

    // Risk puanı hesapla ve filtrele
    const detectedRisks: DetectedRisk[] = [];

    for (const [key, data] of studentMap) {
      // Formül: yönlendirme sayısı + disiplin sayısı * 2
      const riskScore = data.referral_count + data.discipline_count * 2;

      // Sadece orta ve üstü risk (score >= 5)
      if (riskScore < 5) continue;

      // Zaten risk listesinde olan aktif öğrencileri atla
      if (existingRiskNames.has(key)) continue;

      // En sık nedenler (top 3)
      const reasonCounts: Record<string, number> = {};
      for (const r of data.reasons) {
        reasonCounts[r] = (reasonCounts[r] || 0) + 1;
      }
      const topReasons = Object.entries(reasonCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([reason]) => reason);

      // Orijinal öğrenci adını bul (büyük/küçük harf korumalı)
      const originalName = [...referrals, ...disciplines]
        .find(r => r.student_name?.trim().toLowerCase() === key)
        ?.student_name?.trim() || key;

      const riskLevel = riskScore >= 10 ? 'high' : 'medium';

      detectedRisks.push({
        student_name: originalName,
        class_display: data.class_display,
        risk_score: riskScore,
        risk_level: riskLevel as 'medium' | 'high' | 'critical',
        referral_count: data.referral_count,
        discipline_count: data.discipline_count,
        total_records: data.referral_count + data.discipline_count,
        last_record_date: data.last_date,
        top_reasons: topReasons,
      });
    }

    // Risk skoruna göre sırala (yüksekten düşüğe)
    detectedRisks.sort((a, b) => b.risk_score - a.risk_score);

    return NextResponse.json({
      detected: detectedRisks,
      total: detectedRisks.length,
      summary: {
        high: detectedRisks.filter(r => r.risk_level === 'high').length,
        medium: detectedRisks.filter(r => r.risk_level === 'medium').length,
      }
    });
  } catch (error) {
    console.error('Risk detection API error:', error);
    return NextResponse.json(
      { error: 'Risk tespiti sırasında hata oluştu' },
      { status: 500 }
    );
  }
}
