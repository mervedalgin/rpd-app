"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, AlertTriangle, Users, X, BarChart3, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { usePanelData } from "../hooks";
import { YONLENDIRME_NEDENLERI } from "@/types";
import { TimeFilter, StatsResponse } from "../types";
import { ClickableStudent } from "@/components/ClickableStudent";

export default function NedenlerPage() {
  const { stats, loadingStats, fetchStats } = usePanelData();
  const [reasonTimeFilter, setReasonTimeFilter] = useState<TimeFilter>("all");
  const [reasonCustomDate, setReasonCustomDate] = useState<string>("");
  const [customDateStats, setCustomDateStats] = useState<StatsResponse | null>(null);
  const [loadingCustomStats, setLoadingCustomStats] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [reasonStudents, setReasonStudents] = useState<{ student_name: string; class_display: string; reason?: string; date?: string }[]>([]);

  const fetchCustomDateStats = async (date: string) => {
    if (!date) return;
    try {
      setLoadingCustomStats(true);
      toast.loading("Tarih verileri yükleniyor...", { id: "custom-date" });
      const res = await fetch(`/api/stats?from=${date}&to=${date}`);
      if (res.ok) {
        const json = await res.json();
        setCustomDateStats(json);
        toast.success(`${new Date(date).toLocaleDateString('tr-TR')} verileri yüklendi`, { id: "custom-date" });
      } else {
        toast.error("Veriler yüklenemedi", { id: "custom-date" });
      }
    } catch (error) {
      console.error("Custom date stats error:", error);
      toast.error("Veriler yüklenemedi", { id: "custom-date" });
    } finally {
      setLoadingCustomStats(false);
    }
  };

  const handleRefresh = async () => {
    toast.loading("İstatistikler yenileniyor...", { id: "refresh" });
    const result = await fetchStats();
    if (result) {
      toast.success("İstatistikler güncellendi", { id: "refresh" });
    } else {
      toast.error("İstatistikler güncellenemedi", { id: "refresh" });
    }
  };

  const handleReasonClick = (reason: string) => {
    if (selectedReason === reason) {
      setSelectedReason(null);
      setReasonStudents([]);
      return;
    }

    setSelectedReason(reason);
    toast.info(`"${reason}" nedeni seçildi`);
    
    const isCustom = reasonTimeFilter === "custom" && reasonCustomDate;
    const sourceStats = isCustom ? customDateStats : stats;
    
    if (!sourceStats?.allStudents) {
      setReasonStudents([]);
      return;
    }

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    
    let fromDate = "";
    let toDate = todayStr;

    if (isCustom) {
      fromDate = reasonCustomDate;
      toDate = reasonCustomDate;
    } else if (reasonTimeFilter === "today") {
      fromDate = todayStr;
    } else if (reasonTimeFilter === "week") {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1);
      fromDate = startOfWeek.toISOString().slice(0, 10);
    } else if (reasonTimeFilter === "month") {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      fromDate = startOfMonth.toISOString().slice(0, 10);
    }

    const filtered = sourceStats.allStudents.filter(s => {
      const matchReason = s.reason === reason;
      if (reasonTimeFilter === "all" && !isCustom) {
        return matchReason;
      }
      const matchDate = s.date >= fromDate && s.date <= toDate;
      return matchReason && matchDate;
    });

    setReasonStudents(filtered);
  };

  const isCustom = reasonTimeFilter === "custom" && reasonCustomDate;
  const sourceStats = isCustom ? customDateStats : stats;
  
  const getReasonData = () => {
    if (isCustom) return sourceStats?.byReason;
    if (reasonTimeFilter === "today") return stats?.byReasonToday;
    if (reasonTimeFilter === "week") return stats?.byReasonWeek;
    if (reasonTimeFilter === "month") return stats?.byReasonMonth;
    return stats?.byReason;
  };

  const getTotalForPeriod = () => {
    if (isCustom) return sourceStats?.totalCount;
    if (reasonTimeFilter === "today") return stats?.todayCount;
    if (reasonTimeFilter === "week") return stats?.weekCount;
    if (reasonTimeFilter === "month") return stats?.monthCount;
    return stats?.totalCount;
  };

  const colors = [
    "from-red-50 to-rose-50 border-red-100 text-red-700",
    "from-orange-50 to-amber-50 border-orange-100 text-orange-700",
    "from-yellow-50 to-lime-50 border-yellow-100 text-yellow-700",
    "from-green-50 to-emerald-50 border-green-100 text-green-700",
    "from-teal-50 to-cyan-50 border-teal-100 text-teal-700",
    "from-blue-50 to-indigo-50 border-blue-100 text-blue-700",
    "from-violet-50 to-purple-50 border-violet-100 text-violet-700",
    "from-pink-50 to-fuchsia-50 border-pink-100 text-pink-700",
    "from-slate-50 to-gray-50 border-slate-100 text-slate-700",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Yönlendirme Nedenleri</h1>
          <p className="text-sm text-slate-500">Neden bazlı istatistikler</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loadingStats}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingStats ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      {/* Zaman Filtresi */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white/80 backdrop-blur p-4 rounded-lg border">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-medium text-slate-500">Dönem:</span>
          {(["today", "week", "month", "all"] as TimeFilter[]).map((filter) => (
            <Button 
              key={filter}
              variant={reasonTimeFilter === filter ? "default" : "outline"} 
              size="sm"
              onClick={() => {
                setReasonTimeFilter(filter);
                setReasonCustomDate("");
                setSelectedReason(null);
                setReasonStudents([]);
              }}
            >
              {filter === "today" && "Bugün"}
              {filter === "week" && "Bu Hafta"}
              {filter === "month" && "Bu Ay"}
              {filter === "all" && "Tüm Zamanlar"}
            </Button>
          ))}
          <div className="flex items-center gap-1 ml-2">
            <span className="text-xs text-slate-400">|</span>
            <CalendarDays className="h-4 w-4 text-slate-400 ml-1" />
            <input
              type="date"
              value={reasonCustomDate}
              onChange={(e) => {
                setReasonCustomDate(e.target.value);
                if (e.target.value) {
                  setReasonTimeFilter("custom");
                  fetchCustomDateStats(e.target.value);
                  setSelectedReason(null);
                  setReasonStudents([]);
                }
              }}
              className={`h-8 px-2 text-xs border rounded-md bg-white/80 ${
                reasonTimeFilter === "custom" 
                  ? "border-blue-500 ring-2 ring-blue-200" 
                  : "border-slate-200"
              }`}
            />
            {reasonCustomDate && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => {
                  setReasonCustomDate("");
                  setReasonTimeFilter("all");
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex gap-2 items-center text-xs text-slate-500">
          <AlertTriangle className="h-4 w-4" />
          {reasonTimeFilter === "today" && "Bugünün yönlendirme nedenleri"}
          {reasonTimeFilter === "week" && "Bu haftanın yönlendirme nedenleri"}
          {reasonTimeFilter === "month" && "Bu ayın yönlendirme nedenleri"}
          {reasonTimeFilter === "all" && "Tüm zamanların yönlendirme nedenleri"}
          {reasonTimeFilter === "custom" && reasonCustomDate && `${new Date(reasonCustomDate).toLocaleDateString('tr-TR')} tarihinin yönlendirme nedenleri`}
        </div>
      </div>

      {/* Neden Kartları */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {YONLENDIRME_NEDENLERI.map((neden, idx) => {
          const reasonData = getReasonData();
          const count = reasonData?.[neden] ?? 0;
          const totalForPeriod = getTotalForPeriod();
          const percentage = totalForPeriod && totalForPeriod > 0 
            ? Math.round((count / totalForPeriod) * 100) 
            : 0;
          const colorClass = colors[idx % colors.length];
          const isSelected = selectedReason === neden;

          return (
            <Card 
              key={neden} 
              className={`bg-gradient-to-br ${colorClass} transition-all cursor-pointer ${
                isSelected 
                  ? "ring-2 ring-offset-2 ring-blue-500 shadow-lg scale-[1.02]" 
                  : "hover:shadow-md hover:scale-[1.01]"
              } ${count === 0 ? "opacity-50" : ""}`}
              onClick={() => count > 0 && handleReasonClick(neden)}
            >
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium truncate flex items-center justify-between" title={neden}>
                  <span>{neden}</span>
                  {isSelected && <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded">Seçili</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold">
                    {loadingStats || loadingCustomStats ? "…" : count}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold opacity-70">%{percentage}</div>
                    <div className="text-[10px] opacity-60">oran</div>
                  </div>
                </div>
                <div className="mt-2 h-1.5 bg-white/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-current opacity-40 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                {count > 0 && (
                  <div className="mt-2 text-[10px] opacity-60 text-center">
                    Detay için tıklayın
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Seçili Neden Öğrenci Listesi */}
      {selectedReason && (
        <Card className="bg-white/80 backdrop-blur border-blue-200 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-blue-700">{selectedReason}</span>
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                  {reasonStudents.length} öğrenci
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  setSelectedReason(null);
                  setReasonStudents([]);
                }}
              >
                <X className="h-3 w-3 mr-1" />
                Kapat
              </Button>
            </CardTitle>
            <p className="text-xs text-slate-500">
              {reasonTimeFilter === "today" && "Bugün"}
              {reasonTimeFilter === "week" && "Bu Hafta"}
              {reasonTimeFilter === "month" && "Bu Ay"}
              {reasonTimeFilter === "all" && "Tüm Zamanlar"}
              {reasonTimeFilter === "custom" && reasonCustomDate && new Date(reasonCustomDate).toLocaleDateString('tr-TR')}
              {" "}için yönlendirilen öğrenciler
            </p>
          </CardHeader>
          <CardContent>
            {reasonStudents.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                Bu dönemde bu nedenle yönlendirilen öğrenci bulunamadı.
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-slate-500 border-b sticky top-0 bg-white">
                    <tr>
                      <th className="text-left py-2 font-medium">#</th>
                      <th className="text-left py-2 font-medium">Öğrenci</th>
                      <th className="text-left py-2 font-medium">Sınıf</th>
                      <th className="text-left py-2 font-medium">Tarih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reasonStudents.map((s, idx) => (
                      <tr key={`${s.student_name}-${idx}`} className="hover:bg-slate-50/50">
                        <td className="py-2 text-slate-400 text-xs">{idx + 1}</td>
                        <td className="py-2">
                          <ClickableStudent studentName={s.student_name} classDisplay={s.class_display} />
                        </td>
                        <td className="py-2 text-slate-600">{s.class_display}</td>
                        <td className="py-2 text-slate-500 text-xs">
                          {s.date ? new Date(s.date).toLocaleDateString('tr-TR') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dönem Özeti */}
      <Card className="bg-white/70">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            Dönem Özeti
            {loadingCustomStats && <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className={`text-center p-3 rounded-lg ${reasonTimeFilter === "today" ? "bg-blue-100 ring-2 ring-blue-300" : "bg-blue-50"}`}>
              <div className="text-2xl font-bold text-blue-900">
                {loadingStats ? "…" : stats?.todayCount ?? 0}
              </div>
              <div className="text-xs text-blue-600">Bugün</div>
            </div>
            <div className={`text-center p-3 rounded-lg ${reasonTimeFilter === "week" ? "bg-emerald-100 ring-2 ring-emerald-300" : "bg-emerald-50"}`}>
              <div className="text-2xl font-bold text-emerald-900">
                {loadingStats ? "…" : stats?.weekCount ?? 0}
              </div>
              <div className="text-xs text-emerald-600">Bu Hafta</div>
            </div>
            <div className={`text-center p-3 rounded-lg ${reasonTimeFilter === "month" ? "bg-purple-100 ring-2 ring-purple-300" : "bg-purple-50"}`}>
              <div className="text-2xl font-bold text-purple-900">
                {loadingStats ? "…" : stats?.monthCount ?? 0}
              </div>
              <div className="text-xs text-purple-600">Bu Ay</div>
            </div>
            <div className={`text-center p-3 rounded-lg ${reasonTimeFilter === "all" ? "bg-slate-200 ring-2 ring-slate-400" : "bg-slate-100"}`}>
              <div className="text-2xl font-bold text-slate-900">
                {loadingStats ? "…" : stats?.totalCount ?? 0}
              </div>
              <div className="text-xs text-slate-600">Toplam</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
