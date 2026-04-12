"use client";

import { useState, useEffect, useMemo } from "react";
import DOMPurify from "isomorphic-dompurify";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Search, 
  RefreshCw, 
  User, 
  Calendar, 
  FileText,
  X,
  UserCheck,
  ChevronRight,
  History,
  Send,
  FileDown,
  FileType,
  Users,
  BarChart3,
  SortAsc,
  SortDesc,
  Star,
  Sparkles,
  Activity,
  BookOpen,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { StudentSummaryCard, ReasonDistributionChart, TeacherDistributionChart, ReferralTimeline, MiniStatCard } from "@/components/charts/StudentCharts";

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

// Sınıf Seçim Kartı
function ClassSelectCard({ 
  classItem, 
  isSelected, 
  onClick
}: { 
  classItem: ClassOption; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative p-3 rounded-xl border-2 text-left transition-all duration-300 w-full
        ${isSelected 
          ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg shadow-emerald-500/10' 
          : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md'
        }
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`
            p-2 rounded-lg
            ${isSelected 
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white' 
              : 'bg-slate-100 text-slate-500'
            }
          `}>
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className={`font-medium text-sm ${isSelected ? 'text-emerald-700' : 'text-slate-700'}`}>
            {classItem.text}
          </span>
        </div>
      </div>
    </button>
  );
}

// Öğrenci Listesi Kartı
function StudentCard({
  student,
  index,
  isSelected,
  onClick,
  referralCount
}: {
  student: Student;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  referralCount?: number;
}) {
  const hasReferrals = referralCount && referralCount > 0;
  
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200
        ${isSelected 
          ? 'bg-gradient-to-r from-violet-50 to-purple-50 border-2 border-violet-400 shadow-md' 
          : 'bg-white hover:bg-slate-50 border border-slate-200 hover:border-violet-200'
        }
      `}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
          ${isSelected 
            ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white' 
            : 'bg-slate-100 text-slate-500'
          }
        `}>
          {index + 1}
        </div>
        <div className="text-left min-w-0">
          <p className={`font-medium text-sm truncate ${isSelected ? 'text-violet-800' : 'text-slate-700'}`}>
            {student.text}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {hasReferrals && (
          <span className={`
            text-xs font-bold px-2 py-1 rounded-full
            ${referralCount >= 5 
              ? 'bg-red-100 text-red-600' 
              : referralCount >= 3 
                ? 'bg-amber-100 text-amber-600'
                : 'bg-blue-100 text-blue-600'
            }
          `}>
            {referralCount}
          </span>
        )}
        <ChevronRight className={`h-4 w-4 ${isSelected ? 'text-violet-500' : 'text-slate-300'}`} />
      </div>
    </button>
  );
}

export default function OgrenciListesiPage() {
  const searchParams = useSearchParams();
  const urlStudent = searchParams.get("student");
  const urlClass = searchParams.get("class");

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [classSearchTerm, setClassSearchTerm] = useState("");
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

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
        toast.success(`${studentName} geçmişi yüklendi`, { icon: '📚' });
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
    setSelectedStudent(null);
    setStudentHistory(null);
    const classText = classes.find(c => c.value === value)?.text || value;
    toast.success(`${classText} seçildi`, { icon: '🎓' });
    loadStudents(value);
  };

  // Öğrenci detayını yükle
  const loadStudentHistory = async (student: Student) => {
    setSelectedStudent(student);
    setLoadingHistory(true);
    setStudentHistory(null);

    try {
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

  // Filtrelenmiş sınıflar
  const filteredClasses = useMemo(() => {
    if (!classSearchTerm.trim()) return classes;
    return classes.filter(c => c.text.toLowerCase().includes(classSearchTerm.toLowerCase()));
  }, [classes, classSearchTerm]);

  // Filtrelenmiş ve sıralı öğrenciler
  const filteredStudents = useMemo(() => {
    let result = students.filter(s => 
      s.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (sortOrder === "desc") {
      result = [...result].reverse();
    }
    
    return result;
  }, [students, searchTerm, sortOrder]);

  // Tarih formatla
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string) => {
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

  // Word olarak indir (docx kütüphanesi ile gerçek .docx)
  const downloadAsWord = async () => {
    if (!selectedStudent || !studentHistory) return;

    setExportingWord(true);
    toast.loading("Word dosyası hazırlanıyor...", { id: "word-export" });

    try {
      const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
              WidthType, AlignmentType, BorderStyle, HeadingLevel,
              ShadingType, TableLayoutType } = await import("docx");
      const { saveAs } = await import("file-saver");

      const classDisplay = urlClass || classes.find(c => c.value === selectedClass)?.text || "";
      const reportDate = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

      // Yardımcı: tablo hücresi
      const cell = (text: string, opts?: { bold?: boolean; shading?: string; width?: number; alignment?: typeof AlignmentType[keyof typeof AlignmentType] }) => {
        return new TableCell({
          width: opts?.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
          shading: opts?.shading ? { type: ShadingType.SOLID, color: opts.shading, fill: opts.shading } : undefined,
          children: [new Paragraph({
            alignment: opts?.alignment || AlignmentType.LEFT,
            spacing: { before: 40, after: 40 },
            children: [new TextRun({ text, bold: opts?.bold, size: 20, font: "Calibri" })]
          })]
        });
      };

      // Başlık hücresi (koyu arka plan, beyaz yazı)
      const headerCell = (text: string, width?: number) => {
        return new TableCell({
          width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
          shading: { type: ShadingType.SOLID, color: "1e3a5f", fill: "1e3a5f" },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 60 },
            children: [new TextRun({ text, bold: true, size: 20, font: "Calibri", color: "FFFFFF" })]
          })]
        });
      };

      const sections: InstanceType<typeof Paragraph>[] = [];

      // === BAŞLIK ===
      sections.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: "REHBERLİK VE PSİKOLOJİK DANIŞMANLIK SERVİSİ", bold: true, size: 28, font: "Calibri", color: "1e3a5f" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "ÖĞRENCİ YÖNLENDİRME GEÇMİŞİ RAPORU", bold: true, size: 24, font: "Calibri", color: "374151" })]
        }),
        // ayırıcı çizgi
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1e3a5f" } },
          spacing: { after: 300 },
          children: []
        })
      );

      // === ÖĞRENCİ BİLGİLERİ TABLOSU ===
      sections.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 120 },
          children: [new TextRun({ text: "ÖĞRENCİ BİLGİLERİ", bold: true, size: 24, font: "Calibri", color: "1e3a5f" })]
        })
      );

      const infoRows = [
        ["Öğrenci Adı Soyadı", selectedStudent.text],
        ["Sınıf / Şube", classDisplay],
        ["Toplam Yönlendirme Sayısı", String(studentHistory.totalReferrals)],
        ["Rapor Tarihi", reportDate],
      ];
      if (studentHistory.stats.topReason) {
        infoRows.splice(3, 0, ["En Sık Yönlendirme Nedeni", `${studentHistory.stats.topReason.name} (${studentHistory.stats.topReason.count} kez)`]);
      }
      // İlk ve son yönlendirme tarihleri
      if (studentHistory.referrals.length > 0) {
        const dates = studentHistory.referrals.map(r => new Date(r.date).getTime());
        const firstDate = new Date(Math.min(...dates)).toLocaleDateString('tr-TR');
        const lastDate = new Date(Math.max(...dates)).toLocaleDateString('tr-TR');
        infoRows.push(["İlk Yönlendirme Tarihi", firstDate]);
        infoRows.push(["Son Yönlendirme Tarihi", lastDate]);
      }

      const infoTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: infoRows.map((row, i) => new TableRow({
          children: [
            cell(row[0], { bold: true, width: 40, shading: i % 2 === 0 ? "f0f4f8" : "FFFFFF" }),
            cell(row[1], { width: 60, shading: i % 2 === 0 ? "f0f4f8" : "FFFFFF" }),
          ]
        }))
      });
      sections.push(infoTable as unknown as InstanceType<typeof Paragraph>);

      // === NEDEN DAGILIMI ===
      if (Object.keys(studentHistory.stats.byReason).length > 0) {
        sections.push(
          new Paragraph({ spacing: { before: 400, after: 120 }, children: [] }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 120 },
            children: [new TextRun({ text: "YÖNLENDİRME NEDENİ DAĞILIMI", bold: true, size: 24, font: "Calibri", color: "1e3a5f" })]
          })
        );

        const sortedReasons = Object.entries(studentHistory.stats.byReason).sort((a, b) => b[1] - a[1]);
        const reasonTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({ children: [headerCell("Neden", 50), headerCell("Sayı", 25), headerCell("Oran", 25)] }),
            ...sortedReasons.map((entry, i) => new TableRow({
              children: [
                cell(entry[0], { width: 50, shading: i % 2 === 0 ? "f9fafb" : "FFFFFF" }),
                cell(String(entry[1]), { width: 25, alignment: AlignmentType.CENTER, shading: i % 2 === 0 ? "f9fafb" : "FFFFFF" }),
                cell(`%${((entry[1] / studentHistory.totalReferrals) * 100).toFixed(0)}`, { width: 25, alignment: AlignmentType.CENTER, shading: i % 2 === 0 ? "f9fafb" : "FFFFFF" }),
              ]
            }))
          ]
        });
        sections.push(reasonTable as unknown as InstanceType<typeof Paragraph>);
      }

      // === OGRETMEN DAGILIMI ===
      if (Object.keys(studentHistory.stats.byTeacher).length > 0) {
        sections.push(
          new Paragraph({ spacing: { before: 400, after: 120 }, children: [] }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 120 },
            children: [new TextRun({ text: "YÖNLENDİREN ÖĞRETMEN DAĞILIMI", bold: true, size: 24, font: "Calibri", color: "1e3a5f" })]
          })
        );

        const sortedTeachers = Object.entries(studentHistory.stats.byTeacher).sort((a, b) => b[1] - a[1]);
        const teacherTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({ children: [headerCell("Öğretmen", 50), headerCell("Sayı", 25), headerCell("Oran", 25)] }),
            ...sortedTeachers.map((entry, i) => new TableRow({
              children: [
                cell(entry[0], { width: 50, shading: i % 2 === 0 ? "f9fafb" : "FFFFFF" }),
                cell(String(entry[1]), { width: 25, alignment: AlignmentType.CENTER, shading: i % 2 === 0 ? "f9fafb" : "FFFFFF" }),
                cell(`%${((entry[1] / studentHistory.totalReferrals) * 100).toFixed(0)}`, { width: 25, alignment: AlignmentType.CENTER, shading: i % 2 === 0 ? "f9fafb" : "FFFFFF" }),
              ]
            }))
          ]
        });
        sections.push(teacherTable as unknown as InstanceType<typeof Paragraph>);
      }

      // === AYLIK TREND ===
      if (studentHistory.referrals.length > 0) {
        const monthlyMap: Record<string, number> = {};
        studentHistory.referrals.forEach(r => {
          const d = new Date(r.date);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          monthlyMap[key] = (monthlyMap[key] || 0) + 1;
        });
        const sortedMonths = Object.entries(monthlyMap).sort((a, b) => a[0].localeCompare(b[0]));

        if (sortedMonths.length > 1) {
          sections.push(
            new Paragraph({ spacing: { before: 400, after: 120 }, children: [] }),
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              spacing: { after: 120 },
              children: [new TextRun({ text: "AYLIK YÖNLENDİRME TRENDİ", bold: true, size: 24, font: "Calibri", color: "1e3a5f" })]
            })
          );

          const monthNames: Record<string, string> = { "01":"Ocak","02":"Şubat","03":"Mart","04":"Nisan","05":"Mayıs","06":"Haziran","07":"Temmuz","08":"Ağustos","09":"Eylül","10":"Ekim","11":"Kasım","12":"Aralık" };
          const trendTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            layout: TableLayoutType.FIXED,
            rows: [
              new TableRow({ children: [headerCell("Ay", 40), headerCell("Yönlendirme Sayısı", 30), headerCell("Grafik", 30)] }),
              ...sortedMonths.map((entry, i) => {
                const [year, month] = entry[0].split('-');
                const maxCount = Math.max(...sortedMonths.map(s => s[1]));
                const bar = "\u2588".repeat(Math.round((entry[1] / maxCount) * 10));
                return new TableRow({
                  children: [
                    cell(`${monthNames[month] || month} ${year}`, { width: 40, shading: i % 2 === 0 ? "f9fafb" : "FFFFFF" }),
                    cell(String(entry[1]), { width: 30, alignment: AlignmentType.CENTER, shading: i % 2 === 0 ? "f9fafb" : "FFFFFF" }),
                    cell(bar, { width: 30, shading: i % 2 === 0 ? "f9fafb" : "FFFFFF" }),
                  ]
                });
              })
            ]
          });
          sections.push(trendTable as unknown as InstanceType<typeof Paragraph>);
        }
      }

      // === DETAYLI YÖNLENDİRME KAYITLARI ===
      sections.push(
        new Paragraph({ spacing: { before: 400, after: 120 }, children: [] }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 120 },
          children: [new TextRun({ text: "DETAYLI YÖNLENDİRME KAYITLARI", bold: true, size: 24, font: "Calibri", color: "1e3a5f" })]
        })
      );

      if (studentHistory.totalReferrals === 0) {
        sections.push(new Paragraph({
          spacing: { before: 100, after: 100 },
          children: [new TextRun({ text: "Bu öğrenci için yönlendirme kaydı bulunmuyor.", italics: true, color: "059669", size: 22, font: "Calibri" })]
        }));
      } else {
        const detailTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({
              children: [
                headerCell("#", 6),
                headerCell("Tarih", 16),
                headerCell("Neden", 24),
                headerCell("Öğretmen", 20),
                headerCell("Not", 34),
              ]
            }),
            ...studentHistory.referrals.map((r, idx) => {
              const date = new Date(r.date);
              const dateStr = date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
              const bg = idx % 2 === 0 ? "f9fafb" : "FFFFFF";
              return new TableRow({
                children: [
                  cell(String(idx + 1), { width: 6, alignment: AlignmentType.CENTER, shading: bg }),
                  cell(dateStr, { width: 16, shading: bg }),
                  cell(r.reason, { width: 24, shading: bg }),
                  cell(r.teacherName, { width: 20, shading: bg }),
                  cell(r.notes || '-', { width: 34, shading: bg }),
                ]
              });
            })
          ]
        });
        sections.push(detailTable as unknown as InstanceType<typeof Paragraph>);
      }

      // === FOOTER ===
      sections.push(
        new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: "d1d5db" } },
          spacing: { before: 400, after: 40 },
          children: []
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
          children: [new TextRun({ text: "Bu rapor RPD Yönlendirme Sistemi tarafından otomatik olarak oluşturulmuştur.", size: 18, font: "Calibri", color: "9ca3af", italics: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 40 },
          children: [new TextRun({ text: `Rapor Tarihi: ${reportDate}`, size: 18, font: "Calibri", color: "9ca3af" })]
        })
      );

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: { top: 720, bottom: 720, right: 720, left: 720 },
            }
          },
          children: sections
        }]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${selectedStudent.text.replace(/\s+/g, '_')}_rapor.docx`);

      toast.success("Word raporu indirildi!", { id: "word-export" });
    } catch (error) {
      console.error("Word export error:", error);
      toast.error("Word dosyası oluşturulamadı", { id: "word-export" });
    } finally {
      setExportingWord(false);
    }
  };

  // PDF olarak indir (html2pdf.js ile gerçek PDF)
  const downloadAsPdf = async () => {
    if (!selectedStudent || !studentHistory) return;

    setExportingPdf(true);
    toast.loading("PDF dosyası hazırlanıyor...", { id: "pdf-export" });

    try {
      const html2pdf = (await import("html2pdf.js")).default;

      const classDisplay = urlClass || classes.find(c => c.value === selectedClass)?.text || "";
      const reportDate = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

      // İstatistikler
      const sortedReasons = Object.entries(studentHistory.stats.byReason).sort((a, b) => b[1] - a[1]);
      const sortedTeachers = Object.entries(studentHistory.stats.byTeacher).sort((a, b) => b[1] - a[1]);

      // Aylık trend
      const monthlyMap: Record<string, number> = {};
      studentHistory.referrals.forEach(r => {
        const d = new Date(r.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap[key] = (monthlyMap[key] || 0) + 1;
      });
      const sortedMonths = Object.entries(monthlyMap).sort((a, b) => a[0].localeCompare(b[0]));
      const monthNames: Record<string, string> = { "01":"Ocak","02":"Şubat","03":"Mart","04":"Nisan","05":"Mayıs","06":"Haziran","07":"Temmuz","08":"Ağustos","09":"Eylül","10":"Ekim","11":"Kasım","12":"Aralık" };

      // İlk/son tarih
      let firstDate = "", lastDate = "";
      if (studentHistory.referrals.length > 0) {
        const dates = studentHistory.referrals.map(r => new Date(r.date).getTime());
        firstDate = new Date(Math.min(...dates)).toLocaleDateString('tr-TR');
        lastDate = new Date(Math.max(...dates)).toLocaleDateString('tr-TR');
      }

      let html = `
        <div id="pdf-report" style="font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 10px;">
          <!-- BAŞLIK -->
          <div style="text-align: center; margin-bottom: 8px;">
            <h1 style="margin: 0; font-size: 20px; color: #1e3a5f; letter-spacing: 1px;">REHBERLİK VE PSİKOLOJİK DANIŞMANLIK SERVİSİ</h1>
            <h2 style="margin: 4px 0 0 0; font-size: 15px; color: #4b5563; font-weight: 500;">Öğrenci Yönlendirme Geçmişi Raporu</h2>
          </div>
          <hr style="border: none; border-top: 2px solid #1e3a5f; margin: 10px 0 16px 0;" />

          <!-- ÖĞRENCİ BİLGİLERİ -->
          <div style="background: #f0f4f8; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
            <h3 style="margin: 0 0 10px 0; font-size: 13px; color: #1e3a5f; text-transform: uppercase; letter-spacing: 0.5px;">Öğrenci Bilgileri</h3>
            <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
              <tr><td style="padding: 4px 8px; font-weight: 600; width: 200px; color: #374151;">Öğrenci Adı Soyadı</td><td style="padding: 4px 8px;">${selectedStudent.text}</td></tr>
              <tr><td style="padding: 4px 8px; font-weight: 600; color: #374151;">Sınıf / Şube</td><td style="padding: 4px 8px;">${classDisplay}</td></tr>
              <tr><td style="padding: 4px 8px; font-weight: 600; color: #374151;">Toplam Yönlendirme</td><td style="padding: 4px 8px;"><strong style="font-size: 14px; color: ${studentHistory.totalReferrals >= 5 ? '#dc2626' : studentHistory.totalReferrals >= 3 ? '#d97706' : '#2563eb'};">${studentHistory.totalReferrals}</strong></td></tr>
              ${studentHistory.stats.topReason ? `<tr><td style="padding: 4px 8px; font-weight: 600; color: #374151;">En Sık Neden</td><td style="padding: 4px 8px;">${studentHistory.stats.topReason.name} (${studentHistory.stats.topReason.count} kez)</td></tr>` : ''}
              ${firstDate ? `<tr><td style="padding: 4px 8px; font-weight: 600; color: #374151;">İlk Yönlendirme</td><td style="padding: 4px 8px;">${firstDate}</td></tr>` : ''}
              ${lastDate ? `<tr><td style="padding: 4px 8px; font-weight: 600; color: #374151;">Son Yönlendirme</td><td style="padding: 4px 8px;">${lastDate}</td></tr>` : ''}
              <tr><td style="padding: 4px 8px; font-weight: 600; color: #374151;">Rapor Tarihi</td><td style="padding: 4px 8px;">${reportDate}</td></tr>
            </table>
          </div>
      `;

      // İSTATİSTİKLER - Neden ve Öğretmen yan yana
      if (sortedReasons.length > 0 || sortedTeachers.length > 0) {
        html += `<div style="display: flex; gap: 12px; margin-bottom: 16px;">`;

        if (sortedReasons.length > 0) {
          html += `
            <div style="flex: 1; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
              <h3 style="margin: 0 0 8px 0; font-size: 12px; color: #1e3a5f; text-transform: uppercase;">Neden Dağılımı</h3>
              <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
                <tr style="background: #1e3a5f; color: white;">
                  <th style="padding: 5px 8px; text-align: left; border-radius: 4px 0 0 0;">Neden</th>
                  <th style="padding: 5px 8px; text-align: center; width: 50px;">Sayı</th>
                  <th style="padding: 5px 8px; text-align: center; width: 50px; border-radius: 0 4px 0 0;">Oran</th>
                </tr>
                ${sortedReasons.map((entry, i) => `
                  <tr style="background: ${i % 2 === 0 ? '#f9fafb' : '#fff'};">
                    <td style="padding: 4px 8px; border-bottom: 1px solid #f3f4f6;">${entry[0]}</td>
                    <td style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #f3f4f6; font-weight: 600;">${entry[1]}</td>
                    <td style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #f3f4f6;">%${((entry[1] / studentHistory.totalReferrals) * 100).toFixed(0)}</td>
                  </tr>
                `).join('')}
              </table>
            </div>`;
        }

        if (sortedTeachers.length > 0) {
          html += `
            <div style="flex: 1; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
              <h3 style="margin: 0 0 8px 0; font-size: 12px; color: #1e3a5f; text-transform: uppercase;">Yönlendiren Öğretmen Dağılımı</h3>
              <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
                <tr style="background: #1e3a5f; color: white;">
                  <th style="padding: 5px 8px; text-align: left; border-radius: 4px 0 0 0;">Öğretmen</th>
                  <th style="padding: 5px 8px; text-align: center; width: 50px;">Sayı</th>
                  <th style="padding: 5px 8px; text-align: center; width: 50px; border-radius: 0 4px 0 0;">Oran</th>
                </tr>
                ${sortedTeachers.map((entry, i) => `
                  <tr style="background: ${i % 2 === 0 ? '#f9fafb' : '#fff'};">
                    <td style="padding: 4px 8px; border-bottom: 1px solid #f3f4f6;">${entry[0]}</td>
                    <td style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #f3f4f6; font-weight: 600;">${entry[1]}</td>
                    <td style="padding: 4px 8px; text-align: center; border-bottom: 1px solid #f3f4f6;">%${((entry[1] / studentHistory.totalReferrals) * 100).toFixed(0)}</td>
                  </tr>
                `).join('')}
              </table>
            </div>`;
        }

        html += `</div>`;
      }

      // AYLIK TREND
      if (sortedMonths.length > 1) {
        const maxCount = Math.max(...sortedMonths.map(s => s[1]));
        html += `
          <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
            <h3 style="margin: 0 0 10px 0; font-size: 12px; color: #1e3a5f; text-transform: uppercase;">Aylık Yönlendirme Trendi</h3>
            ${sortedMonths.map(entry => {
              const [year, month] = entry[0].split('-');
              const pct = (entry[1] / maxCount) * 100;
              return `
                <div style="display: flex; align-items: center; margin-bottom: 4px; font-size: 11px;">
                  <span style="width: 90px; color: #374151; font-weight: 500;">${monthNames[month] || month} ${year}</span>
                  <div style="flex: 1; background: #f3f4f6; border-radius: 4px; height: 18px; margin: 0 8px;">
                    <div style="width: ${pct}%; background: linear-gradient(90deg, #3b82f6, #1e3a5f); height: 100%; border-radius: 4px; min-width: 20px;"></div>
                  </div>
                  <span style="width: 30px; text-align: right; font-weight: 600; color: #1e3a5f;">${entry[1]}</span>
                </div>`;
            }).join('')}
          </div>`;
      }

      // DETAYLI KAYITLAR
      html += `
        <h3 style="margin: 0 0 10px 0; font-size: 13px; color: #1e3a5f; text-transform: uppercase; letter-spacing: 0.5px;">Detaylı Yönlendirme Kayıtları</h3>
      `;

      if (studentHistory.totalReferrals === 0) {
        html += `<p style="color: #059669; font-style: italic; font-size: 12px;">Bu öğrenci için yönlendirme kaydı bulunmuyor.</p>`;
      } else {
        html += `
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 16px;">
            <thead>
              <tr style="background: #1e3a5f; color: white;">
                <th style="padding: 6px 8px; text-align: center; width: 30px; border-radius: 4px 0 0 0;">#</th>
                <th style="padding: 6px 8px; text-align: left; width: 80px;">Tarih</th>
                <th style="padding: 6px 8px; text-align: left;">Neden</th>
                <th style="padding: 6px 8px; text-align: left; width: 120px;">Öğretmen</th>
                <th style="padding: 6px 8px; text-align: left; border-radius: 0 4px 0 0;">Not</th>
              </tr>
            </thead>
            <tbody>
              ${studentHistory.referrals.map((r, idx) => {
                const date = new Date(r.date);
                const dateStr = date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                return `
                  <tr style="background: ${idx % 2 === 0 ? '#f9fafb' : '#fff'};">
                    <td style="padding: 5px 8px; text-align: center; border-bottom: 1px solid #e5e7eb;">${idx + 1}</td>
                    <td style="padding: 5px 8px; border-bottom: 1px solid #e5e7eb;">${dateStr}</td>
                    <td style="padding: 5px 8px; border-bottom: 1px solid #e5e7eb;">${r.reason}</td>
                    <td style="padding: 5px 8px; border-bottom: 1px solid #e5e7eb;">${r.teacherName}</td>
                    <td style="padding: 5px 8px; border-bottom: 1px solid #e5e7eb;">${r.notes || '-'}</td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>`;
      }

      // FOOTER
      html += `
          <hr style="border: none; border-top: 1px solid #d1d5db; margin: 20px 0 10px 0;" />
          <p style="text-align: center; font-size: 10px; color: #9ca3af; font-style: italic; margin: 0;">
            Bu rapor RPD Yönlendirme Sistemi tarafından otomatik olarak oluşturulmuştur. | Rapor Tarihi: ${reportDate}
          </p>
        </div>`;

      // Geçici DOM elementi oluştur
      const container = document.createElement('div');
      container.innerHTML = DOMPurify.sanitize(html);
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (html2pdf() as any)
        .set({
          margin: [8, 8, 8, 8],
          filename: `${selectedStudent.text.replace(/\s+/g, '_')}_rapor.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        })
        .from(container.firstElementChild)
        .save();

      document.body.removeChild(container);

      toast.success("PDF raporu indirildi!", { id: "pdf-export" });
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("PDF dosyası oluşturulamadı", { id: "pdf-export" });
    } finally {
      setExportingPdf(false);
    }
  };

  const lastReferralDate = studentHistory?.referrals[0]?.date 
    ? formatDate(studentHistory.referrals[0].date) 
    : undefined;

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
        
        {/* Animated Background Elements */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl animate-float-slow" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-300/20 blur-3xl animate-float-reverse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl animate-pulse-glow" />
        
        {/* Floating Particles */}
        <div className="absolute top-10 right-20 h-2 w-2 rounded-full bg-blue-200/60 animate-float animation-delay-100" />
        <div className="absolute top-20 right-40 h-1.5 w-1.5 rounded-full bg-cyan-200/60 animate-float animation-delay-300" />
        <div className="absolute bottom-16 left-32 h-2 w-2 rounded-full bg-indigo-200/60 animate-float animation-delay-500" />
        <div className="absolute top-1/3 left-1/4 h-1 w-1 rounded-full bg-white/40 animate-sparkle animation-delay-200" />
        <div className="absolute bottom-1/3 right-1/4 h-1.5 w-1.5 rounded-full bg-blue-300/50 animate-sparkle animation-delay-700" />
        
        <div className="relative">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                <Users className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Öğrenci Listesi</h1>
                <p className="text-cyan-100">Sınıf seçin ve öğrenci geçmişlerini görüntüleyin</p>
              </div>
            </div>
            
            {/* Hızlı İstatistikler */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-3 py-2 border border-white/10 hover:bg-white/20 transition-all cursor-default">
                <GraduationCap className="h-4 w-4 text-cyan-200" />
                <div>
                  <p className="text-[10px] text-cyan-200 uppercase tracking-wider">Sınıf</p>
                  <p className="text-lg font-bold leading-none">{classes.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-3 py-2 border border-white/10 hover:bg-white/20 transition-all cursor-default">
                <User className="h-4 w-4 text-indigo-200" />
                <div>
                  <p className="text-[10px] text-cyan-200 uppercase tracking-wider">Öğrenci</p>
                  <p className="text-lg font-bold leading-none">{students.length}</p>
                </div>
              </div>
              {studentHistory && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/30 backdrop-blur-sm px-3 py-2 border border-emerald-400/30 hover:bg-emerald-500/40 transition-all cursor-default">
                  <History className="h-4 w-4 text-emerald-200" />
                  <div>
                    <p className="text-[10px] text-emerald-200 uppercase tracking-wider">Yönlendirme</p>
                    <p className="text-lg font-bold leading-none">{studentHistory.totalReferrals}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Alt bilgi çubuğu - Geliştirilmiş */}
          <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Sıralama */}
              <div className="flex items-center bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setSortOrder("asc")}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${
                    sortOrder === "asc" 
                      ? "bg-white text-blue-600 shadow-sm" 
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  <SortAsc className="h-3 w-3" />
                  A-Z
                </button>
                <button
                  onClick={() => setSortOrder("desc")}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${
                    sortOrder === "desc" 
                      ? "bg-white text-blue-600 shadow-sm" 
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  <SortDesc className="h-3 w-3" />
                  Z-A
                </button>
              </div>
              
              {/* Seçili Öğrenci */}
              {selectedStudent && (
                <Badge className="bg-emerald-500/30 text-white border-emerald-400/30 hover:bg-emerald-500/40">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-300" />
                  {selectedStudent.text}
                </Badge>
              )}
              
              {/* Seçili Sınıf */}
              {selectedClass && (
                <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
                  <BookOpen className="h-3 w-3 mr-1" />
                  {classes.find(c => c.value === selectedClass)?.text}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Excel Export */}
              {students.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const classText = classes.find(c => c.value === selectedClass)?.text || "sinif";
                    const csvContent = "No,Öğrenci Adı\n" + 
                      students.map((s, i) => `${i + 1},"${s.text}"`).join("\n");
                    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `ogrenci-listesi-${classText}-${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success("Öğrenci listesi indirildi");
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white border-0"
                >
                  <FileDown className="h-4 w-4 mr-1" />
                  Liste
                </Button>
              )}
              
              {/* Seçimi Temizle */}
              {selectedStudent && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => {
                    setSelectedStudent(null);
                    setStudentHistory(null);
                  }}
                  className="bg-red-500/20 hover:bg-red-500/30 text-white border-0"
                >
                  <X className="h-4 w-4 mr-1" />
                  Temizle
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Özet Kartları */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-200 text-xs font-medium">Toplam Sınıf</p>
                <p className="text-3xl font-bold mt-1">{classes.length}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <GraduationCap className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-200 text-xs font-medium">Seçili Sınıf</p>
                <p className="text-lg font-bold mt-1 truncate">
                  {selectedClass ? classes.find(c => c.value === selectedClass)?.text : "-"}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-0 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-200 text-xs font-medium">Öğrenci Sayısı</p>
                <p className="text-3xl font-bold mt-1">{filteredStudents.length}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <User className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-200 text-xs font-medium">Seçili Öğrenci</p>
                <p className="text-lg font-bold mt-1 truncate">
                  {selectedStudent?.text || "-"}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Star className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sınıf Seçimi */}
      <Card className="bg-white/80 backdrop-blur border-0 shadow-lg overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-teal-50 pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <GraduationCap className="h-3.5 w-3.5 text-white" />
              </div>
              Sınıf Seçin
              <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-100 text-xs font-medium text-emerald-600">
                {filteredClasses.length} sınıf
              </span>
            </CardTitle>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Sınıf ara..."
                value={classSearchTerm}
                onChange={(e) => setClassSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-full md:w-48 transition-all"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {loadingClasses ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
            </div>
          ) : (
            <div className="grid gap-2 grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 max-h-[200px] overflow-y-auto">
              {filteredClasses.map((classItem) => (
                <ClassSelectCard
                  key={classItem.value}
                  classItem={classItem}
                  isSelected={selectedClass === classItem.value}
                  onClick={() => handleClassChange(selectedClass === classItem.value ? "" : classItem.value)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Sol Panel - Öğrenci Listesi */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-white/80 backdrop-blur border-0 shadow-lg overflow-hidden">
            <CardHeader className="border-b bg-gradient-to-r from-violet-50 to-purple-50 pb-4">
              <div className="flex flex-col gap-3">
                <CardTitle className="text-sm font-medium text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                      <User className="h-3.5 w-3.5 text-white" />
                    </div>
                    Öğrenciler
                  </span>
                  {selectedClass && !loadingStudents && (
                    <Badge className="bg-violet-100 text-violet-700 border-0">
                      {filteredStudents.length} öğrenci
                    </Badge>
                  )}
                </CardTitle>
                
                {selectedClass && (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Öğrenci ara..."
                        className="pl-9 h-9 bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    >
                      {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="h-[500px] overflow-y-auto space-y-2">
                {!selectedClass ? (
                  <div className="h-full flex items-center justify-center text-slate-400 px-4">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                        <GraduationCap className="h-10 w-10 text-slate-400" />
                      </div>
                      <p className="font-medium text-slate-600">Sınıf Seçin</p>
                      <p className="text-xs mt-1">Yukarıdan bir sınıf seçerek<br/>öğrenci listesini görüntüleyin</p>
                    </div>
                  </div>
                ) : loadingStudents ? (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin text-violet-500 mr-2" />
                    Öğrenciler yükleniyor...
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 px-4">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                        <User className="h-10 w-10 text-slate-400" />
                      </div>
                      <p className="font-medium text-slate-600">Öğrenci Bulunamadı</p>
                      <p className="text-xs mt-1">
                        {searchTerm ? `"${searchTerm}" ile eşleşen öğrenci yok` : "Bu sınıfta öğrenci bulunmuyor"}
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredStudents.map((student, idx) => (
                    <StudentCard
                      key={student.value}
                      student={student}
                      index={idx}
                      isSelected={selectedStudent?.value === student.value}
                      onClick={() => loadStudentHistory(student)}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sağ Panel - Öğrenci Detayı */}
        <div className="lg:col-span-3 space-y-4">
          {!selectedStudent ? (
            <Card className="bg-white/80 backdrop-blur border-0 shadow-lg h-full">
              <CardContent className="h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                    <Sparkles className="h-12 w-12 text-violet-400" />
                  </div>
                  <p className="font-semibold text-slate-700 text-lg">Öğrenci Seçin</p>
                  <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
                    Listeden bir öğrenciye tıklayarak yönlendirme geçmişini ve detaylı analizleri görüntüleyin
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : loadingHistory ? (
            <Card className="bg-white/80 backdrop-blur border-0 shadow-lg h-full">
              <CardContent className="h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-violet-500 mx-auto mb-4" />
                  <p className="text-slate-500">Öğrenci geçmişi yükleniyor...</p>
                </div>
              </CardContent>
            </Card>
          ) : studentHistory ? (
            <div className="space-y-4">
              {/* Özet Kart */}
              <StudentSummaryCard
                totalReferrals={studentHistory.totalReferrals}
                topReason={studentHistory.stats.topReason}
                teacherCount={Object.keys(studentHistory.stats.byTeacher).length}
                lastReferralDate={lastReferralDate}
              />

              {/* Mini İstatistikler */}
              <div className="grid gap-3 md:grid-cols-2">
                <MiniStatCard
                  title="Farklı Neden"
                  value={Object.keys(studentHistory.stats.byReason).length}
                  icon={<FileText className="h-4 w-4 text-white" />}
                  color="bg-gradient-to-br from-amber-500 to-orange-600"
                  bgColor="bg-amber-50"
                />
                <MiniStatCard
                  title="Farklı Öğretmen"
                  value={Object.keys(studentHistory.stats.byTeacher).length}
                  icon={<UserCheck className="h-4 w-4 text-white" />}
                  color="bg-gradient-to-br from-cyan-500 to-blue-600"
                  bgColor="bg-cyan-50"
                />
              </div>

              {/* Export Butonları */}
              <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2">
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
                      Telegram'a Gönder
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
                      Word İndir
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
                      PDF İndir
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Grafikler */}
              {studentHistory.totalReferrals > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-violet-500" />
                        Neden Dağılımı
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ReasonDistributionChart data={studentHistory.stats.byReason} />
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-cyan-500" />
                        Öğretmen Dağılımı
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TeacherDistributionChart data={studentHistory.stats.byTeacher} />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Zaman Çizelgesi */}
              {studentHistory.totalReferrals > 0 && (
                <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-emerald-500" />
                      Son 30 Gün Aktivitesi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ReferralTimeline referrals={studentHistory.referrals} />
                  </CardContent>
                </Card>
              )}

              {/* Yönlendirme Listesi */}
              <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100 pb-4">
                  <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800">
                      <History className="h-3.5 w-3.5 text-white" />
                    </div>
                    Yönlendirme Geçmişi
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                      {studentHistory.totalReferrals} kayıt
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {studentHistory.totalReferrals === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                      </div>
                      <p className="font-medium text-slate-600">Yönlendirme Kaydı Yok</p>
                      <p className="text-xs mt-1">Bu öğrenci için henüz yönlendirme yapılmamış</p>
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100">
                      {studentHistory.referrals.map((referral, idx) => (
                        <div key={referral.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className={`
                              flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold
                              ${idx === 0 
                                ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white' 
                                : 'bg-slate-100 text-slate-500'
                              }
                            `}>
                              {studentHistory.totalReferrals - idx}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={`${getReasonColor(referral.reason)} border text-xs`}>
                                  {referral.reason}
                                </Badge>
                                {idx === 0 && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-500 text-white">
                                    SON
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <UserCheck className="h-3.5 w-3.5" />
                                  {referral.teacherName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {formatDateTime(referral.date)}
                                </span>
                              </div>
                              {referral.notes && (
                                <p className="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                  📝 {referral.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
