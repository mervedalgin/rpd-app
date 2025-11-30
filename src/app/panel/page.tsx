"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, TrendingUp, UserCheck, RefreshCw, BarChart3, Clock } from "lucide-react";
import { toast } from "sonner";
import { usePanelData } from "./hooks";
import { ClickableStudent } from "@/components/ClickableStudent";

// Canlı Saat Komponenti
function LiveClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    // İlk render'da saati ayarla
    setTime(new Date());
    
    // Her saniye güncelle
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!time) return <span className="animate-pulse">Yükleniyor...</span>;

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  return (
    <div className="space-y-1">
      <div className="text-base font-medium text-slate-800">
        {time.toLocaleDateString('tr-TR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </div>
      <div className="flex items-center gap-1 font-mono text-3xl font-bold text-slate-900">
        <span className="bg-slate-800 text-white px-2 py-1 rounded-md transition-all duration-300">
          {hours}
        </span>
        <span className="text-slate-400 animate-pulse">:</span>
        <span className="bg-slate-800 text-white px-2 py-1 rounded-md transition-all duration-300">
          {minutes}
        </span>
        <span className="text-slate-400 animate-pulse">:</span>
        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2 py-1 rounded-md transition-all duration-150">
          {seconds}
        </span>
      </div>
    </div>
  );
}

export default function PanelOzetPage() {
  const { stats, loadingStats, statsError, fetchStats } = usePanelData();

  const handleRefresh = async () => {
    toast.loading("İstatistikler yenileniyor...", { id: "refresh" });
    const result = await fetchStats();
    if (result) {
      toast.success("İstatistikler güncellendi", { id: "refresh" });
    } else {
      toast.error("İstatistikler güncellenemedi", { id: "refresh" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Özet</h1>
          <p className="text-sm text-slate-500">Genel istatistik özeti</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loadingStats}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingStats ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      {statsError && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{statsError}</p>
      )}

      {/* Özet Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Clock className="h-4 w-4 animate-pulse" />
              Sunucu Zamanı
              <span className="ml-auto flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LiveClock />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Bugün
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-900">
              {loadingStats ? "…" : stats?.todayCount ?? 0}
            </div>
            <p className="text-xs text-blue-600 mt-1">yönlendirme yapıldı</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Bu Hafta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-emerald-900">
              {loadingStats ? "…" : stats?.weekCount ?? 0}
            </div>
            <p className="text-xs text-emerald-600 mt-1">toplam yönlendirme</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Bu Ay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-amber-900">
              {loadingStats ? "…" : stats?.monthCount ?? 0}
            </div>
            <p className="text-xs text-amber-600 mt-1">aylık toplam</p>
          </CardContent>
        </Card>
      </div>

      {/* En Aktif Öğretmen */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              En Aktif Öğretmen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-900 truncate">
              {loadingStats ? "…" : stats?.topTeacher?.name ?? "Henüz veri yok"}
            </div>
            {stats?.topTeacher && (
              <p className="text-xs text-purple-600 mt-1">
                {stats.topTeacher.count} yönlendirme
              </p>
            )}
          </CardContent>
        </Card>

        {/* Toplam */}
        <Card className="bg-white/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Tüm Zamanlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-slate-900">
              {loadingStats ? "…" : stats?.totalCount ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">toplam yönlendirme kaydı</p>
          </CardContent>
        </Card>
      </div>

      {/* Bugün Yönlendirilen Öğrenciler */}
      {stats?.todayStudents && stats.todayStudents.length > 0 && (
        <Card className="bg-white/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">
              Bugün Yönlendirilen Öğrenciler
              <span className="ml-2 text-xs font-normal text-slate-500">
                ({stats.todayStudents.length} öğrenci)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-500 border-b sticky top-0 bg-white">
                  <tr>
                    <th className="text-left py-2 font-medium">#</th>
                    <th className="text-left py-2 font-medium">Öğrenci</th>
                    <th className="text-left py-2 font-medium">Sınıf</th>
                    <th className="text-left py-2 font-medium">Neden</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.todayStudents.map((s, idx) => (
                    <tr key={`${s.student_name}-${idx}`} className="hover:bg-slate-50/50">
                      <td className="py-2 text-slate-400 text-xs">{idx + 1}</td>
                      <td className="py-2">
                        <ClickableStudent studentName={s.student_name} classDisplay={s.class_display} />
                      </td>
                      <td className="py-2 text-slate-600">{s.class_display}</td>
                      <td className="py-2 text-slate-500 text-xs">{s.reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
