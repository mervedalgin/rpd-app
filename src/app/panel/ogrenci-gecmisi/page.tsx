"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { 
  History, 
  Search, 
  Trash2, 
  RefreshCw, 
  AlertTriangle,
  GraduationCap,
  User,
  Calendar,
  FileText,
  Gavel,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface ReferralRecord {
  id: string;
  reason: string;
  teacherName: string;
  classDisplay: string;
  date: string;
  notes: string | null;
}

interface DisciplineRecord {
  id: string;
  student_id: string;
  student_name: string;
  class_key: string;
  class_display: string;
  event_date: string;
  reason: string;
  penalty_type: string;
  notes: string | null;
  created_at: string;
}

interface ClassOption {
  value: string;
  text: string;
}

interface StudentOption {
  value: string;
  text: string;
}

export default function OgrenciGecmisiPage() {
  // State
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [disciplineRecords, setDisciplineRecords] = useState<DisciplineRecord[]>([]);
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [showReferrals, setShowReferrals] = useState(true);
  const [showDiscipline, setShowDiscipline] = useState(true);

  // Sınıfları yükle
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await fetch("/api/data");
        if (res.ok) {
          const data = await res.json();
          setClasses(data.sinifSubeList || []);
        }
      } catch (error) {
        console.error("Classes load error:", error);
        toast.error("Sınıflar yüklenemedi");
      } finally {
        setLoadingClasses(false);
      }
    };
    loadClasses();
  }, []);

  // Öğrencileri yükle
  const loadStudents = async (classKey: string) => {
    if (!classKey) return;
    
    setLoadingStudents(true);
    try {
      const res = await fetch(`/api/students?sinifSube=${encodeURIComponent(classKey)}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data || []);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error("Students load error:", error);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Öğrenci geçmişini yükle
  const loadHistory = async (studentName: string, classDisplay?: string) => {
    if (!studentName) return;
    
    setLoadingHistory(true);
    try {
      // Yönlendirmeleri getir
      const referralRes = await fetch(
        `/api/student-history?studentName=${encodeURIComponent(studentName)}${classDisplay ? `&classDisplay=${encodeURIComponent(classDisplay)}` : ''}`
      );
      if (referralRes.ok) {
        const data = await referralRes.json();
        setReferrals(data.referrals || []);
      }

      // Disiplin kayıtlarını getir
      const disciplineRes = await fetch(
        `/api/discipline?studentName=${encodeURIComponent(studentName)}`
      );
      if (disciplineRes.ok) {
        const data = await disciplineRes.json();
        setDisciplineRecords(data.records || []);
      }
    } catch (error) {
      console.error("History load error:", error);
      toast.error("Geçmiş yüklenemedi");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Sınıf seçimi
  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    setSelectedStudent(null);
    setReferrals([]);
    setDisciplineRecords([]);
    loadStudents(value);
  };

  // Öğrenci seçimi
  const handleStudentChange = (value: string) => {
    const student = students.find(s => s.value === value);
    if (student) {
      setSelectedStudent(student);
      const classText = classes.find(c => c.value === selectedClass)?.text || "";
      loadHistory(student.text, classText);
    }
  };

  // Arama ile geçmiş getir
  const handleSearch = () => {
    if (searchQuery.trim()) {
      setSelectedClass("");
      setSelectedStudent(null);
      loadHistory(searchQuery.trim());
    }
  };

  // Yönlendirme kaydını sil
  const handleDeleteReferral = async (id: string) => {
    if (!confirm("Bu yönlendirme kaydını silmek istediğinizden emin misiniz?")) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/student-history?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setReferrals(prev => prev.filter(r => r.id !== id));
        toast.success("Yönlendirme kaydı silindi");
      } else {
        const data = await res.json();
        toast.error(data.error || "Kayıt silinemedi");
      }
    } catch (error) {
      console.error("Delete referral error:", error);
      toast.error("Kayıt silinirken hata oluştu");
    } finally {
      setDeletingId(null);
    }
  };

  // Disiplin kaydını sil
  const handleDeleteDiscipline = async (id: string) => {
    if (!confirm("Bu disiplin kaydını silmek istediğinizden emin misiniz?")) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/discipline?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setDisciplineRecords(prev => prev.filter(r => r.id !== id));
        toast.success("Disiplin kaydı silindi");
      } else {
        const data = await res.json();
        toast.error(data.error || "Kayıt silinemedi");
      }
    } catch (error) {
      console.error("Delete discipline error:", error);
      toast.error("Kayıt silinirken hata oluştu");
    } finally {
      setDeletingId(null);
    }
  };

  // Tarih formatla
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalRecords = referrals.length + disciplineRecords.length;

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <History className="h-7 w-7 text-indigo-600" />
            Öğrenci Geçmişi
          </h1>
          <p className="text-sm text-slate-500 mt-1">Öğrenci yönlendirme ve disiplin kayıtlarını görüntüleyin ve yönetin</p>
        </div>
      </div>

      {/* Arama ve Filtreler */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Sınıf ve Öğrenci Seçimi */}
        <Card className="lg:col-span-4 bg-gradient-to-br from-indigo-50 to-white border-indigo-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-indigo-800 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-indigo-600" />
              Öğrenci Seçimi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sınıf */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Sınıf / Şube</label>
              <Select
                disabled={loadingClasses}
                value={selectedClass}
                onValueChange={handleClassChange}
              >
                <SelectTrigger className="h-10 border-indigo-200">
                  <SelectValue placeholder={loadingClasses ? "Yükleniyor..." : "Sınıf seçin"} />
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

            {/* Öğrenci */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Öğrenci</label>
              <Select
                disabled={!selectedClass || loadingStudents}
                value={selectedStudent?.value || ""}
                onValueChange={handleStudentChange}
              >
                <SelectTrigger className="h-10 border-indigo-200">
                  <SelectValue placeholder={
                    loadingStudents ? "Yükleniyor..." : 
                    !selectedClass ? "Önce sınıf seçin" : 
                    "Öğrenci seçin"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seçili Öğrenci */}
            {selectedStudent && (
              <div className="p-3 bg-indigo-100 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-800">
                    {selectedStudent.text}
                  </span>
                </div>
                <p className="text-xs text-indigo-600 mt-1">
                  {classes.find(c => c.value === selectedClass)?.text}
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    {referrals.length} Yönlendirme
                  </Badge>
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                    {disciplineRecords.length} Disiplin
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* İsimle Arama */}
        <Card className="lg:col-span-4 bg-white/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Search className="h-5 w-5 text-slate-600" />
              İsimle Ara
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Öğrenci Adı</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Öğrenci adı yazın..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="h-10"
                />
                <Button 
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || loadingHistory}
                  className="gap-2"
                >
                  {loadingHistory ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Ara
                </Button>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Öğrenci adının bir kısmını yazarak tüm kayıtlarda arama yapabilirsiniz.
            </p>
          </CardContent>
        </Card>

        {/* Özet İstatistikler */}
        <Card className="lg:col-span-4 bg-gradient-to-br from-slate-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-600" />
              Özet
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : totalRecords > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-700">Yönlendirmeler</span>
                  <Badge className="bg-blue-600 text-white">{referrals.length}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm text-orange-700">Disiplin Kayıtları</span>
                  <Badge className="bg-orange-600 text-white">{disciplineRecords.length}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">Toplam</span>
                  <Badge className="bg-slate-700 text-white">{totalRecords}</Badge>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p className="text-sm">Öğrenci seçin veya arama yapın</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Kayıtlar */}
      {(selectedStudent || searchQuery) && !loadingHistory && (
        <div className="space-y-4">
          {/* Yönlendirme Kayıtları */}
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader className="pb-3">
              <button 
                onClick={() => setShowReferrals(!showReferrals)}
                className="w-full flex items-center justify-between"
              >
                <CardTitle className="text-base font-semibold text-blue-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                  Yönlendirme Kayıtları ({referrals.length})
                </CardTitle>
                {showReferrals ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>
            </CardHeader>
            {showReferrals && (
              <CardContent>
                {referrals.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>Yönlendirme kaydı bulunamadı</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {referrals.map((record) => (
                      <div
                        key={record.id}
                        className="p-4 bg-blue-50 rounded-lg border border-blue-100 hover:border-blue-200 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className="bg-blue-600 text-white">
                                {record.reason}
                              </Badge>
                              <span className="text-xs text-slate-500">
                                {record.classDisplay}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {record.teacherName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(record.date)}
                              </span>
                            </div>
                            {record.notes && (
                              <p className="mt-2 text-sm text-slate-600 bg-white p-2 rounded">
                                {record.notes}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50 flex-shrink-0"
                            onClick={() => handleDeleteReferral(record.id)}
                            disabled={deletingId === record.id}
                          >
                            {deletingId === record.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Disiplin Kayıtları */}
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader className="pb-3">
              <button 
                onClick={() => setShowDiscipline(!showDiscipline)}
                className="w-full flex items-center justify-between"
              >
                <CardTitle className="text-base font-semibold text-orange-800 flex items-center gap-2">
                  <Gavel className="h-5 w-5 text-orange-600" />
                  Disiplin Kayıtları ({disciplineRecords.length})
                </CardTitle>
                {showDiscipline ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>
            </CardHeader>
            {showDiscipline && (
              <CardContent>
                {disciplineRecords.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Gavel className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>Disiplin kaydı bulunamadı</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {disciplineRecords.map((record) => (
                      <div
                        key={record.id}
                        className="p-4 bg-orange-50 rounded-lg border border-orange-100 hover:border-orange-200 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className="bg-orange-600 text-white flex items-center gap-1">
                                <ShieldAlert className="h-3 w-3" />
                                {record.penalty_type}
                              </Badge>
                              <Badge variant="outline" className="bg-white">
                                {record.reason}
                              </Badge>
                            </div>
                            <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                              <span className="flex items-center gap-1">
                                <GraduationCap className="h-3.5 w-3.5" />
                                {record.class_display}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                Olay: {record.event_date ? new Date(record.event_date).toLocaleDateString('tr-TR') : '-'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              Kayıt: {formatDate(record.created_at)}
                            </p>
                            {record.notes && (
                              <p className="mt-2 text-sm text-slate-600 bg-white p-2 rounded">
                                {record.notes}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50 flex-shrink-0"
                            onClick={() => handleDeleteDiscipline(record.id)}
                            disabled={deletingId === record.id}
                          >
                            {deletingId === record.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      )}

      {/* Yükleniyor */}
      {loadingHistory && (
        <Card className="bg-white/80 backdrop-blur">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
              <p className="text-slate-600">Kayıtlar yükleniyor...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Başlangıç Mesajı */}
      {!selectedStudent && !searchQuery && !loadingHistory && (
        <Card className="bg-white/80 backdrop-blur">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-slate-400">
              <History className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Öğrenci Geçmişi</p>
              <p className="text-sm mt-1">Kayıtları görüntülemek için bir öğrenci seçin veya isimle arama yapın</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
