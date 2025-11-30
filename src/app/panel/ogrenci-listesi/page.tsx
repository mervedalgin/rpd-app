"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Search, 
  RefreshCw, 
  User, 
  Calendar, 
  FileText,
  AlertTriangle,
  X,
  Clock,
  UserCheck,
  ChevronRight,
  History,
  Send,
  FileDown,
  FileType
} from "lucide-react";
import { toast } from "sonner";

interface Student {
  value: string;
  text: string;
}

interface ClassOption {
  value: string;
  text: string;
}

interface ReferralHistory {
  id: string;
  reason: string;
  teacherName: string;
  classDisplay: string;
  date: string;
  notes: string | null;
}

interface StudentHistory {
  studentName: string;
  classDisplay: string;
  totalReferrals: number;
  referrals: ReferralHistory[];
  stats: {
    byReason: Record<string, number>;
    byTeacher: Record<string, number>;
    topReason: { name: string; count: number } | null;
  };
}

export default function OgrenciListesiPage() {
  const searchParams = useSearchParams();
  const urlStudent = searchParams.get("student");
  const urlClass = searchParams.get("class");

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Öğrenci detay modal
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentHistory, setStudentHistory] = useState<StudentHistory | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // URL'den gelen öğrenci için işlem yapıldı mı?
  const [urlProcessed, setUrlProcessed] = useState(false);

  // Export işlemleri için state'ler
  const [sendingTelegram, setSendingTelegram] = useState(false);
  const [exportingWord, setExportingWord] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

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

  // URL'den gelen öğrenciyi direkt yükle
  useEffect(() => {
    if (urlStudent && !urlProcessed && !loadingClasses) {
      setUrlProcessed(true);
      // Direkt öğrenci geçmişini yükle
      loadStudentHistoryDirect(urlStudent, urlClass || undefined);
    }
  }, [urlStudent, urlClass, urlProcessed, loadingClasses]);

  // Direkt öğrenci geçmişi yükle (sınıf seçmeden)
  const loadStudentHistoryDirect = async (studentName: string, classDisplay?: string) => {
    setSelectedStudent({ value: studentName, text: studentName });
    setLoadingHistory(true);
    setStudentHistory(null);

    try {
      let url = `/api/student-history?studentName=${encodeURIComponent(studentName)}`;
      if (classDisplay) {
        url += `&classDisplay=${encodeURIComponent(classDisplay)}`;
      }

      const res = await fetch(url);

      if (res.ok) {
        const data = await res.json();
        setStudentHistory(data);
        toast.success(`${studentName} geçmişi yüklendi`);
      } else {
        toast.error("Öğrenci geçmişi yüklenemedi");
      }
    } catch (error) {
      console.error("Student history error:", error);
      toast.error("Öğrenci geçmişi yüklenirken hata oluştu");
    } finally {
      setLoadingHistory(false);
    }
  };

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
        toast.error("Öğrenciler yüklenemedi");
      }
    } catch (error) {
      console.error("Students load error:", error);
      setStudents([]);
      toast.error("Öğrenciler yüklenirken hata oluştu");
    } finally {
      setLoadingStudents(false);
    }
  };

  // Sınıf seçimi
  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    setSearchTerm("");
    const classText = classes.find(c => c.value === value)?.text || value;
    toast.info(`${classText} sınıfı seçildi`);
    loadStudents(value);
  };

  // Öğrenci detayını yükle
  const loadStudentHistory = async (student: Student) => {
    setSelectedStudent(student);
    setLoadingHistory(true);
    setStudentHistory(null);

    try {
      // Öğrenci adını parse et (numara varsa kaldır)
      const studentName = student.text.replace(/^\d+\s+/, '').trim();
      const classDisplay = classes.find(c => c.value === selectedClass)?.text || '';

      const res = await fetch(
        `/api/student-history?studentName=${encodeURIComponent(studentName)}&classDisplay=${encodeURIComponent(classDisplay)}`
      );

      if (res.ok) {
        const data = await res.json();
        setStudentHistory(data);
      } else {
        toast.error("Öğrenci geçmişi yüklenemedi");
      }
    } catch (error) {
      console.error("Student history error:", error);
      toast.error("Öğrenci geçmişi yüklenirken hata oluştu");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Filtrelenmiş öğrenciler
  const filteredStudents = students.filter(s => 
    s.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Tarih formatla
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Neden rengi
  const getReasonColor = (reason: string) => {
    const reasonLower = reason.toLowerCase();
    if (reasonLower.includes('devamsızlık')) return 'bg-red-100 text-red-700 border-red-200';
    if (reasonLower.includes('kavga') || reasonLower.includes('şiddet')) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (reasonLower.includes('ders')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (reasonLower.includes('sosyal') || reasonLower.includes('uyum')) return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // Öğrenci geçmişi mesaj formatı
  const formatHistoryMessage = () => {
    if (!selectedStudent || !studentHistory) return "";
    
    const classDisplay = urlClass || classes.find(c => c.value === selectedClass)?.text || "";
    let message = `📋 *ÖĞRENCİ GEÇMİŞİ RAPORU*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `👤 *Öğrenci:* ${selectedStudent.text}\n`;
    message += `🏫 *Sınıf:* ${classDisplay}\n`;
    message += `📊 *Toplam Yönlendirme:* ${studentHistory.totalReferrals}\n`;
    
    if (studentHistory.stats.topReason) {
      message += `⚠️ *En Sık Neden:* ${studentHistory.stats.topReason.name} (${studentHistory.stats.topReason.count})\n`;
    }
    
    message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    if (studentHistory.totalReferrals === 0) {
      message += `\n✅ Bu öğrenci için yönlendirme kaydı bulunmuyor.\n`;
    } else {
      message += `\n📝 *Yönlendirme Detayları:*\n\n`;
      
      studentHistory.referrals.forEach((r, idx) => {
        const date = new Date(r.date);
        const dateStr = date.toLocaleDateString('tr-TR');
        message += `*${idx + 1}.* ${r.reason}\n`;
        message += `   👨‍🏫 ${r.teacherName} | 📅 ${dateStr}\n`;
        if (r.notes) {
          message += `   📌 ${r.notes}\n`;
        }
        if (idx < studentHistory.referrals.length - 1) {
          message += `───────────────────\n`;
        }
      });
    }
    
    message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `_Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}_`;
    
    return message;
  };

  // Telegram'a gönder
  const sendToTelegram = async () => {
    if (!selectedStudent || !studentHistory) return;
    
    setSendingTelegram(true);
    toast.loading("Telegram'a gönderiliyor...", { id: "telegram-send" });
    
    try {
      const message = formatHistoryMessage();
      const res = await fetch("/api/telegram-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      
      if (res.ok) {
        toast.success("Öğrenci geçmişi Telegram'a gönderildi!", { id: "telegram-send" });
      } else {
        toast.error("Telegram'a gönderilemedi", { id: "telegram-send" });
      }
    } catch (error) {
      console.error("Telegram send error:", error);
      toast.error("Telegram gönderiminde hata oluştu", { id: "telegram-send" });
    } finally {
      setSendingTelegram(false);
    }
  };

  // Word olarak indir
  const downloadAsWord = () => {
    if (!selectedStudent || !studentHistory) return;
    
    setExportingWord(true);
    toast.loading("Word dosyası hazırlanıyor...", { id: "word-export" });
    
    try {
      const classDisplay = urlClass || classes.find(c => c.value === selectedClass)?.text || "";
      
      let htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="utf-8"><title>Öğrenci Geçmişi</title></head>
        <body style="font-family: Arial, sans-serif;">
        <h1 style="color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px;">ÖĞRENCİ GEÇMİŞİ RAPORU</h1>
        <table style="width: 100%; margin-bottom: 20px;">
          <tr><td style="font-weight: bold; width: 150px;">Öğrenci:</td><td>${selectedStudent.text}</td></tr>
          <tr><td style="font-weight: bold;">Sınıf:</td><td>${classDisplay}</td></tr>
          <tr><td style="font-weight: bold;">Toplam Yönlendirme:</td><td>${studentHistory.totalReferrals}</td></tr>
          ${studentHistory.stats.topReason ? `<tr><td style="font-weight: bold;">En Sık Neden:</td><td>${studentHistory.stats.topReason.name} (${studentHistory.stats.topReason.count})</td></tr>` : ''}
          <tr><td style="font-weight: bold;">Rapor Tarihi:</td><td>${new Date().toLocaleDateString('tr-TR')}</td></tr>
        </table>
      `;
      
      if (studentHistory.totalReferrals === 0) {
        htmlContent += `<p style="color: #059669; font-style: italic;">Bu öğrenci için yönlendirme kaydı bulunmuyor.</p>`;
      } else {
        htmlContent += `<h2 style="color: #374151; margin-top: 30px;">Yönlendirme Detayları</h2>`;
        htmlContent += `<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">#</th>
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Tarih</th>
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Neden</th>
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Öğretmen</th>
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Not</th>
          </tr>`;
        
        studentHistory.referrals.forEach((r, idx) => {
          const date = new Date(r.date);
          htmlContent += `
            <tr>
              <td style="border: 1px solid #d1d5db; padding: 8px;">${idx + 1}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px;">${date.toLocaleDateString('tr-TR')}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px;">${r.reason}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px;">${r.teacherName}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px;">${r.notes || '-'}</td>
            </tr>`;
        });
        
        htmlContent += `</table>`;
      }
      
      htmlContent += `</body></html>`;
      
      const blob = new Blob([htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedStudent.text.replace(/\s+/g, '_')}_gecmis.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Word dosyası indirildi!", { id: "word-export" });
    } catch (error) {
      console.error("Word export error:", error);
      toast.error("Word dosyası oluşturulamadı", { id: "word-export" });
    } finally {
      setExportingWord(false);
    }
  };

  // PDF olarak indir
  const downloadAsPdf = () => {
    if (!selectedStudent || !studentHistory) return;
    
    setExportingPdf(true);
    toast.loading("PDF dosyası hazırlanıyor...", { id: "pdf-export" });
    
    try {
      const classDisplay = urlClass || classes.find(c => c.value === selectedClass)?.text || "";
      
      // PDF için HTML içeriği oluştur ve yazdır
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error("Pop-up engelleyici aktif olabilir", { id: "pdf-export" });
        setExportingPdf(false);
        return;
      }
      
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Öğrenci Geçmişi - ${selectedStudent.text}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
            .info-table { width: 100%; margin-bottom: 20px; }
            .info-table td { padding: 5px 0; }
            .info-table td:first-child { font-weight: bold; width: 180px; }
            h2 { color: #374151; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #f3f4f6; border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            td { border: 1px solid #d1d5db; padding: 8px; }
            .no-records { color: #059669; font-style: italic; }
            .footer { margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <h1>ÖĞRENCİ GEÇMİŞİ RAPORU</h1>
          <table class="info-table">
            <tr><td>Öğrenci:</td><td>${selectedStudent.text}</td></tr>
            <tr><td>Sınıf:</td><td>${classDisplay}</td></tr>
            <tr><td>Toplam Yönlendirme:</td><td>${studentHistory.totalReferrals}</td></tr>
            ${studentHistory.stats.topReason ? `<tr><td>En Sık Neden:</td><td>${studentHistory.stats.topReason.name} (${studentHistory.stats.topReason.count})</td></tr>` : ''}
            <tr><td>Rapor Tarihi:</td><td>${new Date().toLocaleDateString('tr-TR')}</td></tr>
          </table>
      `;
      
      if (studentHistory.totalReferrals === 0) {
        htmlContent += `<p class="no-records">Bu öğrenci için yönlendirme kaydı bulunmuyor.</p>`;
      } else {
        htmlContent += `<h2>Yönlendirme Detayları</h2>`;
        htmlContent += `<table>
          <tr>
            <th>#</th>
            <th>Tarih</th>
            <th>Neden</th>
            <th>Öğretmen</th>
            <th>Not</th>
          </tr>`;
        
        studentHistory.referrals.forEach((r, idx) => {
          const date = new Date(r.date);
          htmlContent += `
            <tr>
              <td>${idx + 1}</td>
              <td>${date.toLocaleDateString('tr-TR')}</td>
              <td>${r.reason}</td>
              <td>${r.teacherName}</td>
              <td>${r.notes || '-'}</td>
            </tr>`;
        });
        
        htmlContent += `</table>`;
      }
      
      htmlContent += `
          <div class="footer">Bu rapor RPD Yönlendirme Sistemi tarafından oluşturulmuştur.</div>
        </body>
        </html>
      `;
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Yazdırma dialogunu aç
      setTimeout(() => {
        printWindow.print();
        toast.success("PDF olarak kaydetmek için 'PDF olarak kaydet' seçeneğini kullanın", { id: "pdf-export" });
      }, 500);
      
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("PDF dosyası oluşturulamadı", { id: "pdf-export" });
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Öğrenciler</h1>
          <p className="text-sm text-slate-500">Sınıf seçin ve öğrenci geçmişlerini görüntüleyin</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sol Panel - Sınıf ve Öğrenci Listesi */}
        <div className="lg:col-span-1 space-y-4">
          {/* Sınıf Seçimi */}
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                Sınıf / Şube
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                disabled={loadingClasses}
                value={selectedClass}
                onValueChange={handleClassChange}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={loadingClasses ? "Yükleniyor..." : "Sınıf/Şube seçin"} />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Öğrenci Listesi */}
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <User className="h-5 w-5 text-emerald-600" />
                  Öğrenciler
                </span>
                {selectedClass && !loadingStudents && (
                  <Badge variant="secondary" className="text-xs">
                    {filteredStudents.length} öğrenci
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedClass && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Öğrenci ara..."
                    className="pl-9 h-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              )}

              <div className="h-[400px] rounded-lg border border-slate-200/80 bg-white overflow-y-auto">
                {!selectedClass ? (
                  <div className="h-full flex items-center justify-center text-slate-400 px-4">
                    <div className="text-center">
                      <GraduationCap className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Önce bir sınıf seçin</p>
                    </div>
                  </div>
                ) : loadingStudents ? (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                    Yükleniyor...
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 px-4">
                    <div className="text-center">
                      <User className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Öğrenci bulunamadı</p>
                    </div>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {filteredStudents.map((student, idx) => (
                      <li
                        key={student.value}
                        className={`flex items-center justify-between px-3 py-2.5 hover:bg-blue-50/50 cursor-pointer transition-colors ${
                          selectedStudent?.value === student.value ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                        }`}
                        onClick={() => loadStudentHistory(student)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-slate-400 w-5 flex-shrink-0">{idx + 1}</span>
                          <span className="text-sm font-medium text-slate-700 truncate">
                            {student.text}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sağ Panel - Öğrenci Detayı */}
        <div className="lg:col-span-2">
          <Card className="bg-white/80 backdrop-blur h-full">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <History className="h-5 w-5 text-purple-600" />
                  Öğrenci Geçmişi
                </span>
                {selectedStudent && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setSelectedStudent(null);
                      setStudentHistory(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!selectedStudent ? (
                <div className="h-[500px] flex items-center justify-center text-slate-400 px-4">
                  <div className="text-center">
                    <User className="h-16 w-16 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">Öğrenci Seçin</p>
                    <p className="text-xs mt-1">Listeden bir öğrenciye tıklayarak<br/>yönlendirme geçmişini görüntüleyin</p>
                  </div>
                </div>
              ) : loadingHistory ? (
                <div className="h-[500px] flex items-center justify-center text-slate-400">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Geçmiş yükleniyor...
                </div>
              ) : studentHistory ? (
                <div className="h-[500px] overflow-y-auto">
                  {/* Öğrenci Başlık */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-slate-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">
                          {selectedStudent.text}
                        </h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {classes.find(c => c.value === selectedClass)?.text}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {studentHistory.totalReferrals}
                        </div>
                        <p className="text-xs text-slate-500">Toplam Yönlendirme</p>
                      </div>
                    </div>

                    {/* İstatistikler */}
                    {studentHistory.totalReferrals > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {studentHistory.stats.topReason && (
                          <Badge className={`${getReasonColor(studentHistory.stats.topReason.name)} border`}>
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            En sık: {studentHistory.stats.topReason.name} ({studentHistory.stats.topReason.count})
                          </Badge>
                        )}
                        {Object.keys(studentHistory.stats.byTeacher).length > 0 && (
                          <Badge variant="outline" className="bg-white">
                            <UserCheck className="h-3 w-3 mr-1" />
                            {Object.keys(studentHistory.stats.byTeacher).length} farklı öğretmen
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Export Butonları */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={sendToTelegram}
                        disabled={sendingTelegram}
                      >
                        {sendingTelegram ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        Telegram
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                        onClick={downloadAsWord}
                        disabled={exportingWord}
                      >
                        {exportingWord ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <FileType className="h-3.5 w-3.5" />
                        )}
                        Word
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={downloadAsPdf}
                        disabled={exportingPdf}
                      >
                        {exportingPdf ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <FileDown className="h-3.5 w-3.5" />
                        )}
                        PDF
                      </Button>
                    </div>
                  </div>

                  {/* Yönlendirme Listesi */}
                  {studentHistory.totalReferrals === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Yönlendirme Kaydı Yok</p>
                      <p className="text-xs mt-1">Bu öğrenci için henüz yönlendirme yapılmamış</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {studentHistory.referrals.map((referral, idx) => (
                        <div key={referral.id} className="p-4 hover:bg-slate-50/50">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-500">
                              {studentHistory.totalReferrals - idx}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={`${getReasonColor(referral.reason)} border text-xs`}>
                                  {referral.reason}
                                </Badge>
                              </div>
                              <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <UserCheck className="h-3.5 w-3.5" />
                                  {referral.teacherName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {formatDate(referral.date)}
                                </span>
                              </div>
                              {referral.notes && (
                                <p className="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded">
                                  {referral.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Neden Dağılımı */}
                  {studentHistory.totalReferrals > 0 && Object.keys(studentHistory.stats.byReason).length > 1 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                      <h4 className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                        Neden Dağılımı
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(studentHistory.stats.byReason)
                          .sort((a, b) => b[1] - a[1])
                          .map(([reason, count]) => (
                            <Badge 
                              key={reason} 
                              variant="outline" 
                              className={`${getReasonColor(reason)} border`}
                            >
                              {reason}: {count}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
