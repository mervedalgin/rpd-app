"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { usePanelData } from "../hooks";
import { TimeFilter, StatsResponse } from "../types";
import { ClickableStudent } from "@/components/ClickableStudent";

export default function ZamanPage() {
  const { stats, loadingStats, fetchStats, getClassDisplayText } = usePanelData();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [filteredStats, setFilteredStats] = useState<StatsResponse | null>(null);
  const [timeCustomDate, setTimeCustomDate] = useState<string>("");
  const [timeCustomDateStats, setTimeCustomDateStats] = useState<StatsResponse | null>(null);
  const [loadingTimeCustomStats, setLoadingTimeCustomStats] = useState(false);

  const fetchTimeCustomDateStats = async (date: string) => {
    if (!date) return;
    const toastId = toast.loading("Tarih verileri yükleniyor...");
    try {
      setLoadingTimeCustomStats(true);
      const res = await fetch(`/api/stats?from=${date}&to=${date}`);
      if (res.ok) {
        const json = await res.json();
        setTimeCustomDateStats(json);
        setFilteredStats(json);
        toast.success(`${new Date(date).toLocaleDateString('tr-TR')} verileri yüklendi`, { id: toastId });
      } else {
        toast.error("Veriler yüklenemedi", { id: toastId });
      }
    } catch (error) {
      console.error("Time custom date stats error:", error);
      toast.error("Tarih verileri yüklenemedi", { id: toastId });
    } finally {
      setLoadingTimeCustomStats(false);
    }
  };

  const handleTimeFilterChange = async (filter: TimeFilter) => {
    setTimeFilter(filter);
    if (filter !== "custom") {
      setTimeCustomDate("");
      const filterLabels: Record<TimeFilter, string> = {
        today: "Bugün",
        week: "Bu Hafta",
        month: "Bu Ay",
        all: "Tümü",
        custom: ""
      };
      toast.info(`${filterLabels[filter]} filtresi seçildi`);
      const result = await fetchStats(undefined, undefined, filter);
      if (result) setFilteredStats(result);
    }
  };

  const handleRefresh = async () => {
    toast.loading("Veriler yenileniyor...", { id: "refresh" });
    try {
      const result = await fetchStats(undefined, undefined, timeFilter, undefined, false);
      if (result) {
        setFilteredStats(result);
        toast.success("İstatistikler güncellendi", { id: "refresh" });
      } else {
        toast.error("Güncelleme başarısız", { id: "refresh" });
      }
    } catch {
      toast.error("Veriler yenilenemedi", { id: "refresh" });
    }
  };

  const isCustom = timeFilter === "custom" && timeCustomDate;
  const displayStats = isCustom ? timeCustomDateStats : filteredStats || stats;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Günlük / Haftalık</h1>
          <p className="text-sm text-slate-500">Zaman bazlı istatistikler</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loadingStats}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingStats ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      {/* Zaman Filtresi */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white/80 backdrop-blur p-4 rounded-lg border">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-medium text-slate-500">Tarih filtresi:</span>
          {(["today", "week", "month", "all"] as TimeFilter[]).map((filter) => (
            <Button 
              key={filter}
              variant={timeFilter === filter ? "default" : "outline"} 
              size="sm"
              onClick={() => handleTimeFilterChange(filter)}
            >
              {filter === "today" && "Bugün"}
              {filter === "week" && "Bu Hafta"}
              {filter === "month" && "Bu Ay"}
              {filter === "all" && "Tümü"}
            </Button>
          ))}
          <Button 
            variant={timeFilter === "custom" ? "default" : "outline"} 
            size="sm"
            onClick={() => {
              setTimeFilter("custom");
              if (timeCustomDate) {
                fetchTimeCustomDateStats(timeCustomDate);
              }
            }}
          >
            📅 Tarih Seç
          </Button>
          {timeFilter === "custom" && (
            <input
              type="date"
              value={timeCustomDate}
              onChange={(e) => {
                setTimeCustomDate(e.target.value);
                if (e.target.value) {
                  fetchTimeCustomDateStats(e.target.value);
                }
              }}
              className="px-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
        <div className="flex gap-2 items-center text-xs text-slate-500">
          <CalendarDays className="h-4 w-4" />
          {loadingTimeCustomStats && <RefreshCw className="h-3 w-3 animate-spin" />}
          {timeFilter === "today" && "Bugünün verileri gösteriliyor"}
          {timeFilter === "week" && "Bu haftanın verileri gösteriliyor"}
          {timeFilter === "month" && "Bu ayın verileri gösteriliyor"}
          {timeFilter === "all" && "Tüm zamanların verileri gösteriliyor"}
          {timeFilter === "custom" && timeCustomDate && `${new Date(timeCustomDate).toLocaleDateString('tr-TR')} tarihinin verileri gösteriliyor`}
          {timeFilter === "custom" && !timeCustomDate && "Tarih seçiniz"}
        </div>
      </div>

      {/* İstatistik Kartları */}
      {isCustom ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Seçili Tarih
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-900">
                {loadingTimeCustomStats ? "…" : timeCustomDateStats?.totalCount ?? 0}
              </div>
              <p className="text-sm text-blue-600 mt-1">
                {new Date(timeCustomDate).toLocaleDateString('tr-TR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-500">En Aktif Öğretmen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-slate-900 truncate">
                {loadingTimeCustomStats ? "…" : timeCustomDateStats?.topTeacher?.name ?? "-"}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {timeCustomDateStats?.topTeacher ? `${timeCustomDateStats.topTeacher.count} yönlendirme` : "Henüz veri yok"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-500">Karşılaştırma</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Bugün:</span>
                  <span className="font-semibold">{stats?.todayCount ?? 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Bu Hafta:</span>
                  <span className="font-semibold">{stats?.weekCount ?? 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Toplam:</span>
                  <span className="font-semibold">{stats?.totalCount ?? 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-white/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-500">Seçili Dönem</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {loadingStats ? "…" : 
                  timeFilter === "today" ? (displayStats?.todayCount ?? 0) :
                  timeFilter === "week" ? (displayStats?.weekCount ?? 0) :
                  timeFilter === "month" ? (displayStats?.monthCount ?? 0) :
                  (displayStats?.totalCount ?? 0)
                }
              </div>
              <p className="text-xs text-slate-500 mt-1">toplam yönlendirme</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-500">Günlük Ortalama</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {loadingStats ? "…" : (
                  timeFilter === "week" 
                    ? Math.round((displayStats?.weekCount ?? 0) / 7 * 10) / 10
                    : timeFilter === "month"
                    ? Math.round((displayStats?.monthCount ?? 0) / 30 * 10) / 10
                    : displayStats?.todayCount ?? 0
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">yönlendirme/gün</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-500">En Aktif Öğretmen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-slate-900 truncate">
                {loadingStats ? "…" : displayStats?.topTeacher?.name ?? "-"}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {displayStats?.topTeacher ? `${displayStats.topTeacher.count} yönlendirme` : "Henüz veri yok"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Öğrenci Listesi */}
      {(() => {
        const studentList = isCustom 
          ? timeCustomDateStats?.todayStudents 
          : displayStats?.todayStudents;
        
        if (!studentList || studentList.length === 0) return null;
        
        return (
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                {isCustom 
                  ? `${new Date(timeCustomDate).toLocaleDateString('tr-TR')} Tarihindeki Yönlendirmeler`
                  : "Seçili Dönemdeki Yönlendirmeler"
                }
                <span className="ml-2 text-xs font-normal text-slate-500">
                  ({studentList.length} öğrenci)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
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
                    {studentList.map((s, idx) => (
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
        );
      })()}
    </div>
  );
}
