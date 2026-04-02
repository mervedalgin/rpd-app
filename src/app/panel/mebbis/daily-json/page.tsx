"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileJson,
  Plus,
  RefreshCw,
  Download,
  Edit3,
  Trash2,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Save,
  Copy,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface DailyJsonRecord {
  sinif_sube: string;
  ogrenci: string;
  hizmet_turu: string;
  asama1: string;
  asama2: string;
  asama3: string | null;
  tarih: string;
  tarih_alt: string;
  saat_bas: string;
  saat_bitis: string;
  calisma_yeri: string;
}

interface DailyJsonData {
  mode: string;
  total_records: number;
  records: DailyJsonRecord[];
}

interface SavedDailyJson {
  id: string;
  created_at: string;
  updated_at?: string;
  target_date: string;
  json_data: DailyJsonData;
  record_count: number;
  source: "manual" | "auto";
}

interface ReferralStudent {
  student_name: string;
  class_display: string;
  reason?: string;
  created_at?: string;
}

export default function DailyJsonPage() {
  const [savedJsons, setSavedJsons] = useState<SavedDailyJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Manuel oluşturma
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [manualDate, setManualDate] = useState("");
  const [availableStudents, setAvailableStudents] = useState<ReferralStudent[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Düzenleme
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editJsonText, setEditJsonText] = useState("");

  // Kayıtları yükle
  const fetchJsons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/daily-json");
      if (res.ok) {
        const data = await res.json();
        setSavedJsons(data);
      } else {
        toast.error("Kayıtlar yüklenemedi");
      }
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJsons();
  }, [fetchJsons]);

  // Tarih değiştiğinde o tarihteki öğrencileri al
  const fetchStudentsForDate = async (date: string) => {
    if (!date) return;
    setLoadingStudents(true);
    try {
      const res = await fetch(`/api/stats?from=${date}&to=${date}`);
      if (res.ok) {
        const data = await res.json();
        const students: ReferralStudent[] = data.todayStudents ?? [];
        setAvailableStudents(students);
        // Varsayılan: tümü seçili
        setSelectedStudents(students.map((s: ReferralStudent) => s.student_name));
      }
    } catch {
      toast.error("Öğrenci verileri yüklenemedi");
    } finally {
      setLoadingStudents(false);
    }
  };

  // Manuel JSON oluştur
  const handleCreate = async () => {
    if (!manualDate) {
      toast.error("Lütfen tarih seçin");
      return;
    }
    if (selectedStudents.length === 0) {
      toast.error("Lütfen en az bir öğrenci seçin");
      return;
    }

    setGenerating(true);
    const toastId = toast.loading("JSON oluşturuluyor...");
    try {
      const res = await fetch("/api/daily-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_date: manualDate,
          students: selectedStudents,
          source: "manual",
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        toast.success(`JSON oluşturuldu: ${result.data.record_count} kayıt`, { id: toastId });
        setShowCreateModal(false);
        setManualDate("");
        setAvailableStudents([]);
        setSelectedStudents([]);
        fetchJsons();
      } else {
        toast.error(result.error || "JSON oluşturulamadı", { id: toastId });
      }
    } catch {
      toast.error("Bağlantı hatası", { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  // Düzenleme başlat
  const startEdit = (json: SavedDailyJson) => {
    setEditingId(json.id);
    setEditJsonText(JSON.stringify(json.json_data, null, 2));
  };

  // Düzenleme kaydet
  const saveEdit = async () => {
    if (!editingId) return;

    try {
      const parsed = JSON.parse(editJsonText);

      const res = await fetch("/api/daily-json", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, json_data: parsed }),
      });

      if (res.ok) {
        toast.success("JSON güncellendi");
        setEditingId(null);
        setEditJsonText("");
        fetchJsons();
      } else {
        const err = await res.json();
        toast.error(err.error || "Güncelleme başarısız");
      }
    } catch {
      toast.error("Geçersiz JSON formatı");
    }
  };

  // Sil
  const handleDelete = async (id: string) => {
    if (!confirm("Bu JSON kaydını silmek istediğinize emin misiniz?")) return;

    try {
      const res = await fetch(`/api/daily-json?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Kayıt silindi");
        fetchJsons();
      } else {
        toast.error("Silme başarısız");
      }
    } catch {
      toast.error("Bağlantı hatası");
    }
  };

  // JSON indir
  const downloadJson = (json: SavedDailyJson) => {
    const blob = new Blob([JSON.stringify(json.json_data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-${json.target_date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // JSON kopyala
  const copyJson = (json: SavedDailyJson) => {
    navigator.clipboard.writeText(JSON.stringify(json.json_data, null, 2));
    toast.success("JSON panoya kopyalandı");
  };

  // Bugünün tarihini al ve /api/daily-json üzerinden otomatik oluştur
  const triggerAutoGenerate = async () => {
    setGenerating(true);
    const toastId = toast.loading("Otomatik JSON oluşturuluyor...");
    try {
      const now = new Date();
      const todayStr = now.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" }); // YYYY-MM-DD

      const res = await fetch("/api/daily-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_date: todayStr, source: "auto" }),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        if (result.data.record_count === 0) {
          toast.info("Bugün yönlendirme bulunamadı", { id: toastId });
        } else {
          toast.success(`Otomatik JSON oluşturuldu: ${result.data.record_count} kayıt`, { id: toastId });
          fetchJsons();
        }
      } else {
        toast.error(result.error || "Oluşturma başarısız", { id: toastId });
      }
    } catch {
      toast.error("Bağlantı hatası", { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />

        <div className="relative">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <FileJson className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Daily JSON</h1>
                <p className="text-emerald-200">
                  Günlük MEBBİS yönlendirme JSON dosyaları
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={triggerAutoGenerate}
                disabled={generating}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <Zap className={`h-4 w-4 mr-2 ${generating ? "animate-spin" : ""}`} />
                Bugünü Oluştur
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Manuel Oluştur
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchJsons}
                disabled={loading}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Yenile
              </Button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-4 text-sm text-emerald-200">
            <span className="flex items-center gap-1">
              <FileJson className="h-4 w-4" />
              Toplam: <strong className="text-white">{savedJsons.length}</strong> JSON
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Otomatik: Her gün 17:00
            </span>
          </div>
        </div>
      </div>

      {/* Manuel Oluşturma Modalı */}
      {showCreateModal && (
        <Card className="border-2 border-emerald-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Manuel JSON Oluştur
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCreateModal(false);
                  setManualDate("");
                  setAvailableStudents([]);
                  setSelectedStudents([]);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Tarih Seçimi */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                Tarih Seçin
              </label>
              <input
                type="date"
                value={manualDate}
                onChange={(e) => {
                  setManualDate(e.target.value);
                  fetchStudentsForDate(e.target.value);
                }}
                className="w-full md:w-64 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Öğrenci Listesi */}
            {loadingStudents && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Öğrenciler yükleniyor...
              </div>
            )}

            {!loadingStudents && manualDate && availableStudents.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                Bu tarihte yönlendirme bulunamadı.
              </div>
            )}

            {availableStudents.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    <Users className="h-4 w-4 inline mr-1" />
                    Öğrenci Seçin ({selectedStudents.length}/{availableStudents.length})
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedStudents(availableStudents.map(s => s.student_name))}
                      className="text-xs text-emerald-600 hover:underline"
                    >
                      Tümünü Seç
                    </button>
                    <button
                      onClick={() => setSelectedStudents([])}
                      className="text-xs text-slate-500 hover:underline"
                    >
                      Temizle
                    </button>
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg divide-y">
                  {availableStudents.map((s, idx) => (
                    <label
                      key={`${s.student_name}-${idx}`}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-emerald-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(s.student_name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents([...selectedStudents, s.student_name]);
                          } else {
                            setSelectedStudents(selectedStudents.filter(n => n !== s.student_name));
                          }
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-slate-800">{s.student_name}</span>
                        <span className="ml-2 text-xs text-slate-500">{s.class_display}</span>
                      </div>
                      {s.reason && (
                        <span className="text-xs text-slate-400 truncate max-w-[150px]">{s.reason}</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Oluştur Butonu */}
            {availableStudents.length > 0 && (
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleCreate}
                  disabled={generating || selectedStudents.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {generating ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileJson className="h-4 w-4 mr-2" />
                  )}
                  JSON Oluştur ({selectedStudents.length} öğrenci)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* JSON Listesi */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
          <span className="ml-2 text-slate-500">Yükleniyor...</span>
        </div>
      ) : savedJsons.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <FileJson className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-700 mb-2">Henüz JSON Kaydı Yok</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
                Manuel olarak oluşturabilir veya otomatik oluşturulmasını bekleyebilirsiniz.
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                İlk JSON'ı Oluştur
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {savedJsons.map((json) => (
            <Card
              key={json.id}
              className="bg-white/80 backdrop-blur border-0 shadow-lg overflow-hidden"
            >
              <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100 py-3 px-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-lg ${
                        json.source === "auto"
                          ? "bg-gradient-to-br from-blue-500 to-blue-600"
                          : "bg-gradient-to-br from-emerald-500 to-emerald-600"
                      }`}
                    >
                      {json.source === "auto" ? (
                        <Zap className="h-3.5 w-3.5 text-white" />
                      ) : (
                        <Edit3 className="h-3.5 w-3.5 text-white" />
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-800">
                        {new Date(json.target_date + "T12:00:00").toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          weekday: "long",
                        })}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            json.source === "auto"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {json.source === "auto" ? "Otomatik" : "Manuel"}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {json.record_count} kayıt
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(json.created_at).toLocaleString("tr-TR")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyJson(json)}
                      title="Kopyala"
                    >
                      <Copy className="h-4 w-4 text-slate-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadJson(json)}
                      title="İndir"
                    >
                      <Download className="h-4 w-4 text-slate-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        editingId === json.id ? setEditingId(null) : startEdit(json)
                      }
                      title="Düzenle"
                    >
                      <Edit3
                        className={`h-4 w-4 ${
                          editingId === json.id ? "text-emerald-600" : "text-slate-500"
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(json.id)}
                      title="Sil"
                    >
                      <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {editingId === json.id ? (
                  // Düzenleme modu
                  <div className="p-4 space-y-3">
                    <textarea
                      value={editJsonText}
                      onChange={(e) => setEditJsonText(e.target.value)}
                      className="w-full h-80 font-mono text-xs p-3 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
                      spellCheck={false}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingId(null);
                          setEditJsonText("");
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        İptal
                      </Button>
                      <Button
                        size="sm"
                        onClick={saveEdit}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Kaydet
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Önizleme modu - kayıt tablosu
                  <div className="max-h-[300px] overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="text-slate-500 bg-slate-50/80 sticky top-0">
                        <tr>
                          <th className="text-left py-2 px-3 font-medium">#</th>
                          <th className="text-left py-2 px-3 font-medium">Sınıf/Şube</th>
                          <th className="text-left py-2 px-3 font-medium">Öğrenci (TC)</th>
                          <th className="text-left py-2 px-3 font-medium">Tarih</th>
                          <th className="text-left py-2 px-3 font-medium">Saat</th>
                          <th className="text-left py-2 px-3 font-medium">Durum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {json.json_data.records.map((rec, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                            <td className="py-2 px-3 font-mono text-slate-700">
                              {rec.sinif_sube || (
                                <span className="text-red-400">-</span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-700">
                              {rec.ogrenci || (
                                <span className="text-red-400">-</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-600">{rec.tarih_alt}</td>
                            <td className="py-2 px-3 text-slate-600">
                              {rec.saat_bas} - {rec.saat_bitis}
                            </td>
                            <td className="py-2 px-3">
                              {rec.sinif_sube && rec.ogrenci ? (
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
