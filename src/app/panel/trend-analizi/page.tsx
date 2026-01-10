"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  PieChart,
  LineChart,
  Calendar,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  AlertTriangle,
  Target,
  Activity,
  ExternalLink,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface PeriodStats {
  referrals: number;
  discipline: number;
  appointments: number;
  classActivities: number;
  ramReferrals: number;
  parentContacts: number;
  riskStudents: number;
  uniqueStudents: number;
}

interface ComparisonData {
  period1: PeriodStats;
  period2: PeriodStats;
  changes: Record<string, { value: number; percent: number; trend: 'up' | 'down' | 'same' }>;
}

// Karşılaştırma metrikleri
const METRICS = [
  { key: 'referrals', label: 'Yönlendirme', icon: Target, color: 'blue' },
  { key: 'discipline', label: 'Disiplin Olayı', icon: AlertTriangle, color: 'amber' },
  { key: 'appointments', label: 'Tamamlanan Görüşme', icon: CheckCircle2, color: 'green' },
  { key: 'classActivities', label: 'Sınıf Etkinliği', icon: Users, color: 'cyan' },
  { key: 'ramReferrals', label: 'RAM Yönlendirmesi', icon: ExternalLink, color: 'purple' },
  { key: 'parentContacts', label: 'Veli İletişimi', icon: Activity, color: 'pink' },
  { key: 'riskStudents', label: 'Risk Takibi', icon: AlertTriangle, color: 'red' },
  { key: 'uniqueStudents', label: 'Görülen Öğrenci', icon: Users, color: 'indigo' }
];

// Dönem seçenekleri
const PERIOD_OPTIONS = [
  { value: 'this-month', label: 'Bu Ay' },
  { value: 'last-month', label: 'Geçen Ay' },
  { value: 'this-semester', label: 'Bu Dönem' },
  { value: 'last-semester', label: 'Geçen Dönem' },
  { value: 'this-year', label: 'Bu Yıl' },
  { value: 'last-year', label: 'Geçen Yıl' }
];

export default function TrendAnaliziPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [period1, setPeriod1] = useState('this-month');
  const [period2, setPeriod2] = useState('last-month');
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  
  // Dönem tarihlerini hesapla
  const getPeriodDates = useCallback((period: string) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    
    switch (period) {
      case 'this-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'last-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'this-semester':
        // 1. dönem: Eylül-Ocak, 2. dönem: Şubat-Haziran
        if (now.getMonth() >= 8 || now.getMonth() === 0) {
          // 1. dönem
          startDate = new Date(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear(), 8, 1);
          endDate = new Date(now.getMonth() === 0 ? now.getFullYear() : now.getFullYear() + 1, 1, 0);
        } else {
          // 2. dönem
          startDate = new Date(now.getFullYear(), 1, 1);
          endDate = new Date(now.getFullYear(), 5, 30);
        }
        break;
      case 'last-semester':
        if (now.getMonth() >= 8 || now.getMonth() === 0) {
          // Şu an 1. dönemdeyiz, geçen dönem 2. dönem
          startDate = new Date(now.getFullYear(), 1, 1);
          endDate = new Date(now.getFullYear(), 5, 30);
        } else {
          // Şu an 2. dönemdeyiz, geçen dönem 1. dönem
          startDate = new Date(now.getFullYear() - 1, 8, 1);
          endDate = new Date(now.getFullYear(), 1, 0);
        }
        break;
      case 'this-year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case 'last-year':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
    }
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  }, []);
  
  // Dönem verilerini çek
  const fetchPeriodStats = async (startDate: string, endDate: string): Promise<PeriodStats> => {
    const [
      referralsRes,
      disciplineRes,
      activitiesRes,
      ramRes,
      parentContactsRes,
      riskRes
    ] = await Promise.all([
      supabase
        .from('referrals')
        .select('id, student_name, status')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      
      supabase
        .from('discipline')
        .select('id, student_name')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      
      supabase
        .from('class_activities')
        .select('id')
        .gte('activity_date', startDate)
        .lte('activity_date', endDate),
      
      supabase
        .from('ram_referrals')
        .select('id')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      
      supabase
        .from('parent_contacts')
        .select('id')
        .gte('contact_date', startDate)
        .lte('contact_date', endDate),
      
      supabase
        .from('risk_students')
        .select('id')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
    ]);
    
    const referrals = referralsRes.data || [];
    const discipline = disciplineRes.data || [];
    
    // Benzersiz öğrenciler
    const uniqueStudents = new Set([
      ...referrals.map((r: any) => r.student_name),
      ...discipline.map((d: any) => d.student_name)
    ]);
    
    return {
      referrals: referrals.length,
      discipline: discipline.length,
      appointments: referrals.filter((r: any) => r.status === 'completed').length,
      classActivities: (activitiesRes.data || []).length,
      ramReferrals: (ramRes.data || []).length,
      parentContacts: (parentContactsRes.data || []).length,
      riskStudents: (riskRes.data || []).length,
      uniqueStudents: uniqueStudents.size
    };
  };
  
  // Karşılaştırma verilerini yükle
  const loadComparisonData = async () => {
    setIsLoading(true);
    
    try {
      const dates1 = getPeriodDates(period1);
      const dates2 = getPeriodDates(period2);
      
      const [stats1, stats2] = await Promise.all([
        fetchPeriodStats(dates1.start, dates1.end),
        fetchPeriodStats(dates2.start, dates2.end)
      ]);
      
      // Değişimleri hesapla
      const changes: Record<string, { value: number; percent: number; trend: 'up' | 'down' | 'same' }> = {};
      
      Object.keys(stats1).forEach(key => {
        const val1 = stats1[key as keyof PeriodStats];
        const val2 = stats2[key as keyof PeriodStats];
        const diff = val1 - val2;
        const percent = val2 === 0 ? (val1 > 0 ? 100 : 0) : ((diff / val2) * 100);
        
        changes[key] = {
          value: diff,
          percent: Math.round(percent * 10) / 10,
          trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same'
        };
      });
      
      setComparisonData({
        period1: stats1,
        period2: stats2,
        changes
      });
      
    } catch (error) {
      console.error('Karşılaştırma verileri yüklenemedi:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Renk haritası
  const colorMap: Record<string, { bg: string; text: string; light: string }> = {
    blue: { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-100' },
    green: { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-100' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-100' },
    red: { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-100' },
    purple: { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-100' },
    pink: { bg: 'bg-pink-500', text: 'text-pink-600', light: 'bg-pink-100' },
    cyan: { bg: 'bg-cyan-500', text: 'text-cyan-600', light: 'bg-cyan-100' },
    indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600', light: 'bg-indigo-100' }
  };
  
  // Trend ikonu
  const getTrendIcon = (trend: 'up' | 'down' | 'same', isPositive: boolean = true) => {
    if (trend === 'same') return <Minus className="h-4 w-4 text-slate-400" />;
    if (trend === 'up') {
      return isPositive 
        ? <ArrowUpRight className="h-4 w-4 text-green-500" />
        : <ArrowUpRight className="h-4 w-4 text-red-500" />;
    }
    return isPositive
      ? <ArrowDownRight className="h-4 w-4 text-red-500" />
      : <ArrowDownRight className="h-4 w-4 text-green-500" />;
  };
  
  // Pozitif metrikler (artış iyi)
  const positiveMetrics = ['appointments', 'classActivities', 'parentContacts', 'uniqueStudents'];
  // Negatif metrikler (azalış iyi)
  const negativeMetrics = ['discipline', 'riskStudents'];

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Trend Analizi</h1>
            <p className="text-sm text-slate-500">Dönemler arası karşılaştırma</p>
          </div>
        </div>
      </div>
      
      {/* Dönem Seçimi */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1">
              <Label>1. Dönem (Karşılaştırılan)</Label>
              <select
                value={period1}
                onChange={(e) => setPeriod1(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {PERIOD_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            
            <div className="text-2xl text-slate-300 hidden md:block">vs</div>
            
            <div className="space-y-2 flex-1">
              <Label>2. Dönem (Referans)</Label>
              <select
                value={period2}
                onChange={(e) => setPeriod2(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {PERIOD_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            
            <Button onClick={loadComparisonData} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BarChart3 className="h-4 w-4 mr-2" />}
              Karşılaştır
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Sonuçlar */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
            <span className="ml-3 text-slate-600">Veriler analiz ediliyor...</span>
          </CardContent>
        </Card>
      ) : comparisonData ? (
        <div className="space-y-6">
          {/* Özet Kartlar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {METRICS.slice(0, 4).map(metric => {
              const change = comparisonData.changes[metric.key];
              const value1 = comparisonData.period1[metric.key as keyof PeriodStats];
              const value2 = comparisonData.period2[metric.key as keyof PeriodStats];
              const isPositiveMetric = positiveMetrics.includes(metric.key);
              const isNegativeMetric = negativeMetrics.includes(metric.key);
              const Icon = metric.icon;
              
              return (
                <Card key={metric.key}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className={`p-2 rounded-lg ${colorMap[metric.color].light}`}>
                        <Icon className={`h-5 w-5 ${colorMap[metric.color].text}`} />
                      </div>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(change.trend, isNegativeMetric ? false : true)}
                        <span className={`text-sm font-medium ${
                          change.trend === 'same' ? 'text-slate-400' :
                          (change.trend === 'up' && !isNegativeMetric) || (change.trend === 'down' && isNegativeMetric)
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {change.percent > 0 ? '+' : ''}{change.percent}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl font-bold text-slate-800">{value1}</p>
                      <p className="text-xs text-slate-500 mt-1">{metric.label}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Önceki: {value2} ({change.value > 0 ? '+' : ''}{change.value})
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {/* Detaylı Karşılaştırma */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                Detaylı Karşılaştırma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {METRICS.map(metric => {
                  const change = comparisonData.changes[metric.key];
                  const value1 = comparisonData.period1[metric.key as keyof PeriodStats];
                  const value2 = comparisonData.period2[metric.key as keyof PeriodStats];
                  const maxValue = Math.max(value1, value2, 1);
                  const isNegativeMetric = negativeMetrics.includes(metric.key);
                  const Icon = metric.icon;
                  
                  return (
                    <div key={metric.key} className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${colorMap[metric.color].text}`} />
                          <span className="font-medium text-slate-700">{metric.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(change.trend, isNegativeMetric ? false : true)}
                          <Badge className={
                            change.trend === 'same' ? 'bg-slate-200 text-slate-700' :
                            (change.trend === 'up' && !isNegativeMetric) || (change.trend === 'down' && isNegativeMetric)
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }>
                            {change.percent > 0 ? '+' : ''}{change.percent}%
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Karşılaştırma Çubukları */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 w-24">{PERIOD_OPTIONS.find(p => p.value === period1)?.label}</span>
                          <div className="flex-1 h-6 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${colorMap[metric.color].bg} transition-all duration-500`}
                              style={{ width: `${(value1 / maxValue) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-slate-700 w-12 text-right">{value1}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 w-24">{PERIOD_OPTIONS.find(p => p.value === period2)?.label}</span>
                          <div className="flex-1 h-6 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-slate-400 transition-all duration-500"
                              style={{ width: `${(value2 / maxValue) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-slate-500 w-12 text-right">{value2}</span>
                        </div>
                      </div>
                      
                      {/* Fark */}
                      <div className="mt-2 text-xs text-slate-500 text-right">
                        Fark: {change.value > 0 ? '+' : ''}{change.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          
          {/* Özet Değerlendirme */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-emerald-600" />
                Genel Değerlendirme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Olumlu Gelişmeler */}
                <div className="p-4 bg-green-50 rounded-xl">
                  <h4 className="font-medium text-green-700 flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-4 w-4" />
                    Olumlu Gelişmeler
                  </h4>
                  <ul className="space-y-2 text-sm text-green-600">
                    {METRICS.filter(m => {
                      const change = comparisonData.changes[m.key];
                      const isNegative = negativeMetrics.includes(m.key);
                      return (change.trend === 'up' && !isNegative) || (change.trend === 'down' && isNegative);
                    }).map(m => (
                      <li key={m.key} className="flex items-center gap-2">
                        <ArrowUpRight className="h-3 w-3" />
                        {m.label}: {comparisonData.changes[m.key].percent > 0 ? '+' : ''}{comparisonData.changes[m.key].percent}%
                      </li>
                    ))}
                    {METRICS.filter(m => {
                      const change = comparisonData.changes[m.key];
                      const isNegative = negativeMetrics.includes(m.key);
                      return (change.trend === 'up' && !isNegative) || (change.trend === 'down' && isNegative);
                    }).length === 0 && (
                      <li className="text-slate-400">Belirgin olumlu gelişme yok</li>
                    )}
                  </ul>
                </div>
                
                {/* Dikkat Gerektiren */}
                <div className="p-4 bg-red-50 rounded-xl">
                  <h4 className="font-medium text-red-700 flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4" />
                    Dikkat Gerektiren
                  </h4>
                  <ul className="space-y-2 text-sm text-red-600">
                    {METRICS.filter(m => {
                      const change = comparisonData.changes[m.key];
                      const isNegative = negativeMetrics.includes(m.key);
                      return (change.trend === 'down' && !isNegative) || (change.trend === 'up' && isNegative);
                    }).map(m => (
                      <li key={m.key} className="flex items-center gap-2">
                        <ArrowDownRight className="h-3 w-3" />
                        {m.label}: {comparisonData.changes[m.key].percent > 0 ? '+' : ''}{comparisonData.changes[m.key].percent}%
                      </li>
                    ))}
                    {METRICS.filter(m => {
                      const change = comparisonData.changes[m.key];
                      const isNegative = negativeMetrics.includes(m.key);
                      return (change.trend === 'down' && !isNegative) || (change.trend === 'up' && isNegative);
                    }).length === 0 && (
                      <li className="text-slate-400">Dikkat gerektiren alan yok</li>
                    )}
                  </ul>
                </div>
                
                {/* Sabit */}
                <div className="p-4 bg-slate-100 rounded-xl">
                  <h4 className="font-medium text-slate-700 flex items-center gap-2 mb-3">
                    <Minus className="h-4 w-4" />
                    Değişmeyen
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    {METRICS.filter(m => comparisonData.changes[m.key].trend === 'same').map(m => (
                      <li key={m.key} className="flex items-center gap-2">
                        <Minus className="h-3 w-3" />
                        {m.label}: Sabit
                      </li>
                    ))}
                    {METRICS.filter(m => comparisonData.changes[m.key].trend === 'same').length === 0 && (
                      <li className="text-slate-400">Tüm metriklerde değişim var</li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Karşılaştırma yapmak için dönemleri seçin ve "Karşılaştır" butonuna tıklayın</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
