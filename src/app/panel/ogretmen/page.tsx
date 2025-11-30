"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Users, UserCheck, RefreshCw, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { usePanelData } from "../hooks";
import { StatsResponse } from "../types";
import { ClickableStudent } from "@/components/ClickableStudent";

export default function OgretmenPage() {
  const { stats, loadingStats, statsError, teachers, classes, loadingFilters, fetchStats, getClassDisplayText } = usePanelData();
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [filteredStats, setFilteredStats] = useState<StatsResponse | null>(null);

  const handleTeacherChange = async (value: string) => {
    setSelectedTeacher(value);
    if (value) {
      const teacherLabel = teachers.find(t => t.value === value)?.label;
      toast.info(`${teacherLabel} seçildi`);
    }
    const result = await fetchStats(value, getClassDisplayText(selectedClass));
    if (result) setFilteredStats(result);
  };

  const handleClassChange = async (value: string) => {
    setSelectedClass(value);
    const classText = classes.find(c => c.value === value)?.text || value;
    if (value) {
      toast.info(`${classText} seçildi`);
    }
    const result = await fetchStats(selectedTeacher || undefined, classText);
    if (result) setFilteredStats(result);
  };

  const clearFilters = async () => {
    setSelectedTeacher("");
    setSelectedClass("");
    toast.info("Filtreler temizlendi");
    const result = await fetchStats();
    if (result) setFilteredStats(result);
  };

  const handleRefresh = async () => {
    toast.loading("Veriler yenileniyor...", { id: "refresh" });
    try {
      const result = await fetchStats(selectedTeacher || undefined, getClassDisplayText(selectedClass) || undefined, undefined, undefined, false);
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

  const displayStats = filteredStats || stats;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Öğretmen & Sınıf</h1>
          <p className="text-sm text-slate-500">Öğretmen ve sınıf bazlı filtreleme</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loadingStats}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingStats ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      {statsError && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{statsError}</p>
      )}

      {/* Filtreler */}
      <Card className="bg-white/80 backdrop-blur">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">Öğretmen</label>
              <Select
                disabled={loadingFilters || teachers.length === 0}
                value={selectedTeacher}
                onValueChange={handleTeacherChange}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={loadingFilters ? "Yükleniyor..." : "Öğretmen seçin"} />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">Sınıf / Şube</label>
              <Select
                disabled={loadingFilters || classes.length === 0}
                value={selectedClass}
                onValueChange={handleClassChange}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={loadingFilters ? "Yükleniyor..." : "Sınıf/Şube seçin"} />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">&nbsp;</label>
              <Button
                variant="outline"
                className="h-10 w-full gap-2"
                onClick={clearFilters}
                disabled={!selectedTeacher && !selectedClass}
              >
                <X className="h-4 w-4" />
                Filtreleri Temizle
              </Button>
            </div>
          </div>

          {/* Aktif Filtreler */}
          {(selectedTeacher || selectedClass) && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg px-3 py-2 border border-slate-200">
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium text-slate-500">Aktif filtreler:</span>
              </div>
              {selectedTeacher && (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 px-2.5 py-1 rounded-full border border-purple-200 shadow-sm">
                  <UserCheck className="h-3 w-3" />
                  <span className="font-medium">{teachers.find(t => t.value === selectedTeacher)?.label}</span>
                  <button
                    onClick={() => handleTeacherChange("")}
                    className="ml-0.5 hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                    title="Öğretmen filtresini kaldır"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedClass && (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 shadow-sm">
                  <Users className="h-3 w-3" />
                  <span className="font-medium">{classes.find(c => c.value === selectedClass)?.text}</span>
                  <button
                    onClick={() => handleClassChange("")}
                    className="ml-0.5 hover:bg-emerald-200 rounded-full p-0.5 transition-colors"
                    title="Sınıf filtresini kaldır"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* İstatistik Kartları */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Bugün</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-900">
              {loadingStats ? "…" : displayStats?.todayCount ?? 0}
            </div>
            <p className="text-xs text-blue-600 mt-1">yönlendirme</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Bu Hafta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-emerald-900">
              {loadingStats ? "…" : displayStats?.weekCount ?? 0}
            </div>
            <p className="text-xs text-emerald-600 mt-1">yönlendirme</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">En Aktif Öğretmen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-900 truncate">
              {loadingStats ? "…" : displayStats?.topTeacher?.name ?? "-"}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              {displayStats?.topTeacher ? `${displayStats.topTeacher.count} yönlendirme` : "Henüz veri yok"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Öğrenci Listesi */}
      {displayStats?.todayStudents && displayStats.todayStudents.length > 0 ? (
        <Card className="bg-white/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">
              Filtrelenmiş Yönlendirmeler
              <span className="ml-2 text-xs font-normal text-slate-500">
                ({displayStats.todayStudents.length} öğrenci)
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
                  {displayStats.todayStudents.map((s, idx) => (
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
      ) : (
        <div className="h-32 rounded-lg border border-dashed border-slate-300/80 flex items-center justify-center text-sm text-slate-500 bg-white/50">
          {selectedTeacher || selectedClass 
            ? "Bu filtreler için yönlendirme bulunamadı."
            : "Henüz yönlendirme kaydı yok."}
        </div>
      )}
    </div>
  );
}
