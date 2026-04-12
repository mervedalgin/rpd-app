"use client";

import { useState, useEffect, useMemo } from "react";
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
  AlertCircle,
  Clock,
  TrendingUp,
  Download,
  Filter,
  ArrowUpDown,
  Eye,
  MoreHorizontal,
  Printer,
  Share2,
  BarChart3,
  Activity,
  Target,
  Shield,
  Send
} from "lucide-react";
import { toast } from "sonner";
import {
  HistorySummaryCard,
  ReferralReasonsChart,
  PenaltyTypesChart,
  MonthlyActivityChart,
  TeacherReferralsChart,
  ActivityTimeline,
  RiskIndicator,
} from "@/components/charts/StudentHistoryCharts";

interface ReferralRecord {
  id: string;
  studentName?: string;
  reason: string;
  teacherName: string;
  classDisplay: string;
  date: string;
  notes: string | null;
}

interface SearchMatch {
  studentName: string;
  classDisplay: string;
  count: number;
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

type SortField = "date" | "type" | "reason";
type SortOrder = "asc" | "desc";
type FilterType = "all" | "referral" | "discipline";

export default function OgrenciGecmisiPage() {
  // State
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [resolvedClass, setResolvedClass] = useState<string>("");
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([]);

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [disciplineRecords, setDisciplineRecords] = useState<DisciplineRecord[]>([]);
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [showReferrals, setShowReferrals] = useState(true);
  const [showDiscipline, setShowDiscipline] = useState(true);
  const [showCharts, setShowCharts] = useState(true);
  
  // Yeni state'ler
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");
  const [activeTab, setActiveTab] = useState<"all" | "referrals" | "discipline">("all");

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

        // API'den dönen gerçek öğrenci adı ve sınıf bilgisini güncelle
        if (data.studentName) {
          setSelectedStudent(prev => ({
            value: prev?.value || studentName,
            text: data.studentName || prev?.text || studentName,
          }));
        }
        if (data.classDisplay) {
          setResolvedClass(data.classDisplay);
        } else if (data.referrals && data.referrals.length > 0 && data.referrals[0].classDisplay) {
          setResolvedClass(data.referrals[0].classDisplay);
        }
      }

      // Disiplin kayıtlarını getir
      const disciplineRes = await fetch(
        `/api/discipline?studentName=${encodeURIComponent(studentName)}`
      );
      if (disciplineRes.ok) {
        const data = await disciplineRes.json();
        setDisciplineRecords(data.records || []);

        // Disiplin kayıtlarından gerçek öğrenci adını al (daha güvenilir)
        if (data.records && data.records.length > 0) {
          const realStudent = data.records[0];
          setSelectedStudent(prev => ({
            value: prev?.value || studentName,
            text: realStudent.student_name || prev?.text || studentName,
          }));
        }
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

  // Arama ile öğrenci bul
  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;

    setSelectedClass("");
    setSelectedStudent(null);
    setResolvedClass("");
    setReferrals([]);
    setDisciplineRecords([]);
    setSearchMatches([]);
    setLoadingHistory(true);

    try {
      const res = await fetch(
        `/api/student-history?studentName=${encodeURIComponent(query)}`
      );
      if (!res.ok) {
        toast.error("Arama yapılamadı");
        setLoadingHistory(false);
        return;
      }

      const data = await res.json();
      const allReferrals: ReferralRecord[] = data.referrals || [];

      // Farklı öğrencileri grupla
      const studentMap = new Map<string, { classDisplay: string; count: number }>();
      allReferrals.forEach(r => {
        const name = r.studentName || "";
        if (!name) return;
        const key = `${name}|||${r.classDisplay}`;
        const existing = studentMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          studentMap.set(key, { classDisplay: r.classDisplay, count: 1 });
        }
      });

      const matches: SearchMatch[] = Array.from(studentMap.entries()).map(([key, val]) => ({
        studentName: key.split("|||")[0],
        classDisplay: val.classDisplay,
        count: val.count,
      }));

      if (matches.length === 0) {
        // Hiç sonuç yok
        setSelectedStudent({ value: query, text: query });
        toast.info("Bu isimle eşleşen kayıt bulunamadı");
      } else if (matches.length === 1) {
        // Tek öğrenci — direkt yükle
        const m = matches[0];
        setSelectedStudent({ value: m.studentName, text: m.studentName });
        setResolvedClass(m.classDisplay);
        loadHistory(m.studentName, m.classDisplay);
        return; // loadHistory kendi finally'sinde loadingHistory'yi kapatır
      } else {
        // Birden fazla öğrenci — seçim göster
        setSearchMatches(matches);
        toast.info(`${matches.length} farklı öğrenci bulundu, lütfen birini seçin`);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Arama sırasında hata oluştu");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Arama sonuçlarından öğrenci seç
  const handleSelectMatch = (match: SearchMatch) => {
    setSearchMatches([]);
    setSelectedStudent({ value: match.studentName, text: match.studentName });
    setResolvedClass(match.classDisplay);
    loadHistory(match.studentName, match.classDisplay);
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
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string) => {
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

  // Chart verileri hesapla
  const chartData = useMemo(() => {
    // Yönlendirme nedenleri
    const reasonCounts: Record<string, number> = {};
    referrals.forEach(r => {
      reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1;
    });
    const referralReasons = Object.entries(reasonCounts).map(([reason, count]) => ({
      reason,
      count,
    }));

    // Ceza türleri
    const penaltyCounts: Record<string, number> = {};
    disciplineRecords.forEach(r => {
      penaltyCounts[r.penalty_type] = (penaltyCounts[r.penalty_type] || 0) + 1;
    });
    const penaltyTypes = Object.entries(penaltyCounts).map(([type, count]) => ({
      type,
      count,
    }));

    // Öğretmen bazlı
    const teacherCounts: Record<string, number> = {};
    referrals.forEach(r => {
      teacherCounts[r.teacherName] = (teacherCounts[r.teacherName] || 0) + 1;
    });
    const teacherReferrals = Object.entries(teacherCounts)
      .map(([teacher, count]) => ({ teacher, count }))
      .sort((a, b) => b.count - a.count);

    // Aylık aktivite
    const monthlyData: Record<string, { referrals: number; discipline: number }> = {};
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    
    referrals.forEach(r => {
      const date = new Date(r.date);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      if (!monthlyData[monthKey]) monthlyData[monthKey] = { referrals: 0, discipline: 0 };
      monthlyData[monthKey].referrals++;
    });
    
    disciplineRecords.forEach(r => {
      const date = new Date(r.event_date || r.created_at);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      if (!monthlyData[monthKey]) monthlyData[monthKey] = { referrals: 0, discipline: 0 };
      monthlyData[monthKey].discipline++;
    });
    
    const monthlyActivity = Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .slice(-6);

    // Timeline aktiviteleri
    const activities = [
      ...referrals.map(r => ({
        id: r.id,
        type: "referral" as const,
        date: formatDate(r.date),
        title: r.reason,
        description: `${r.teacherName} tarafından yönlendirildi`,
        rawDate: new Date(r.date),
      })),
      ...disciplineRecords.map(r => ({
        id: r.id,
        type: "discipline" as const,
        date: formatDate(r.event_date || r.created_at),
        title: r.penalty_type,
        description: r.reason,
        rawDate: new Date(r.event_date || r.created_at),
      })),
    ].sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

    // Son aktivite tarihi
    const lastActivity = activities.length > 0 ? activities[0].date : undefined;

    return {
      referralReasons,
      penaltyTypes,
      teacherReferrals,
      monthlyActivity,
      activities,
      lastActivity,
    };
  }, [referrals, disciplineRecords]);

  const totalRecords = referrals.length + disciplineRecords.length;

  // Export state'leri
  const [exportingWord, setExportingWord] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Word olarak dışa aktar (docx) — Türkçe karakter + grafik + notlar
  const handleExportWord = async () => {
    if (totalRecords === 0 || !selectedStudent) {
      toast.error("Dışa aktarılacak kayıt yok");
      return;
    }

    setExportingWord(true);
    toast.loading("Word raporu hazırlanıyor...", { id: "word-export" });

    try {
      const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
              WidthType, AlignmentType, BorderStyle, HeadingLevel,
              ShadingType, TableLayoutType } = await import("docx");
      const { saveAs } = await import("file-saver");

      const classDisplay = resolvedClass || classes.find(c => c.value === selectedClass)?.text || "";
      const reportDate = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

      const cell = (text: string, opts?: { bold?: boolean; shading?: string; width?: number; alignment?: typeof AlignmentType[keyof typeof AlignmentType]; color?: string; italics?: boolean }) => {
        return new TableCell({
          width: opts?.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
          shading: opts?.shading ? { type: ShadingType.SOLID, color: opts.shading, fill: opts.shading } : undefined,
          children: [new Paragraph({
            alignment: opts?.alignment || AlignmentType.LEFT,
            spacing: { before: 40, after: 40 },
            children: [new TextRun({ text, bold: opts?.bold, size: 20, font: "Calibri", color: opts?.color, italics: opts?.italics })]
          })]
        });
      };

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

      // Çubuk grafik satırı (metin bazlı)
      const barRow = (label: string, count: number, maxCount: number, total: number, barColor: string) => {
        const pct = ((count / total) * 100).toFixed(0);
        const barLen = Math.max(1, Math.round((count / maxCount) * 20));
        const bar = "\u2588".repeat(barLen);
        return new TableRow({
          children: [
            cell(label, { width: 35 }),
            new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              children: [new Paragraph({
                spacing: { before: 40, after: 40 },
                children: [new TextRun({ text: bar, size: 20, font: "Calibri", color: barColor }), new TextRun({ text: ` ${count}`, bold: true, size: 20, font: "Calibri" })]
              })]
            }),
            cell(`%${pct}`, { width: 25, alignment: AlignmentType.CENTER }),
          ]
        });
      };

      const sections: InstanceType<typeof Paragraph>[] = [];

      // === BAŞLIK ===
      sections.push(
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: "REHBERLİK VE PSİKOLOJİK DANIŞMANLIK SERVİSİ", bold: true, size: 28, font: "Calibri", color: "1e3a5f" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "ÖĞRENCİ GEÇMİŞİ RAPORU", bold: true, size: 24, font: "Calibri", color: "374151" })] }),
        new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1e3a5f" } }, spacing: { after: 300 }, children: [] })
      );

      // === ÖĞRENCİ BİLGİLERİ ===
      sections.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 120 }, children: [new TextRun({ text: "ÖĞRENCİ BİLGİLERİ", bold: true, size: 24, font: "Calibri", color: "1e3a5f" })] }));

      const riskScore = referrals.length + disciplineRecords.length * 2;
      const riskLevel = riskScore >= 10 ? "Yüksek Risk" : riskScore >= 5 ? "Orta Risk" : "Düşük Risk";

      const infoRows = [
        ["Öğrenci Adı Soyadı", selectedStudent.text],
        ["Sınıf / Şube", classDisplay],
        ["Toplam Yönlendirme", String(referrals.length)],
        ["Toplam Disiplin Kaydı", String(disciplineRecords.length)],
        ["Toplam Kayıt", String(totalRecords)],
        ["Risk Seviyesi", riskLevel],
        ["Rapor Tarihi", reportDate],
      ];

      if (referrals.length > 0) {
        const dates = referrals.map(r => new Date(r.date).getTime());
        infoRows.splice(5, 0, ["İlk Yönlendirme", new Date(Math.min(...dates)).toLocaleDateString('tr-TR')]);
        infoRows.splice(6, 0, ["Son Yönlendirme", new Date(Math.max(...dates)).toLocaleDateString('tr-TR')]);
      }

      sections.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED,
        rows: infoRows.map((row, i) => new TableRow({
          children: [
            cell(row[0], { bold: true, width: 40, shading: i % 2 === 0 ? "f0f4f8" : "FFFFFF" }),
            cell(row[1], { width: 60, shading: i % 2 === 0 ? "f0f4f8" : "FFFFFF", bold: row[0] === "Risk Seviyesi", color: row[0] === "Risk Seviyesi" ? (riskScore >= 10 ? "dc2626" : riskScore >= 5 ? "d97706" : "16a34a") : undefined }),
          ]
        }))
      }) as unknown as InstanceType<typeof Paragraph>);

      // === NEDEN DAĞILIMI (GRAFİKLİ) ===
      if (chartData.referralReasons.length > 0) {
        const sorted = [...chartData.referralReasons].sort((a, b) => b.count - a.count);
        const maxCount = sorted[0].count;
        sections.push(
          new Paragraph({ spacing: { before: 400 }, children: [] }),
          new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { after: 120 }, children: [new TextRun({ text: "YÖNLENDİRME NEDENİ DAĞILIMI", bold: true, size: 24, font: "Calibri", color: "1e3a5f" })] })
        );
        sections.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({ children: [headerCell("Neden", 35), headerCell("Grafik", 40), headerCell("Oran", 25)] }),
            ...sorted.map(entry => barRow(entry.reason, entry.count, maxCount, referrals.length, "3b82f6"))
          ]
        }) as unknown as InstanceType<typeof Paragraph>);
      }

      // === CEZA TÜRLERİ DAĞILIMI (GRAFİKLİ) ===
      if (chartData.penaltyTypes.length > 0) {
        const sorted = [...chartData.penaltyTypes].sort((a, b) => b.count - a.count);
        const maxCount = sorted[0].count;
        sections.push(
          new Paragraph({ spacing: { before: 400 }, children: [] }),
          new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { after: 120 }, children: [new TextRun({ text: "DİSİPLİN CEZA TÜRÜ DAĞILIMI", bold: true, size: 24, font: "Calibri", color: "1e3a5f" })] })
        );
        sections.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({ children: [headerCell("Ceza Türü", 35), headerCell("Grafik", 40), headerCell("Oran", 25)] }),
            ...sorted.map(entry => barRow(entry.type, entry.count, maxCount, disciplineRecords.length, "d97706"))
          ]
        }) as unknown as InstanceType<typeof Paragraph>);
      }

      // === ÖĞRETMEN DAĞILIMI (GRAFİKLİ) ===
      if (chartData.teacherReferrals.length > 0) {
        const maxCount = chartData.teacherReferrals[0].count;
        sections.push(
          new Paragraph({ spacing: { before: 400 }, children: [] }),
          new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { after: 120 }, children: [new TextRun({ text: "YÖNLENDİREN ÖĞRETMEN DAĞILIMI", bold: true, size: 24, font: "Calibri", color: "1e3a5f" })] })
        );
        sections.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({ children: [headerCell("Öğretmen", 35), headerCell("Grafik", 40), headerCell("Oran", 25)] }),
            ...chartData.teacherReferrals.map(entry => barRow(entry.teacher, entry.count, maxCount, referrals.length, "8b5cf6"))
          ]
        }) as unknown as InstanceType<typeof Paragraph>);
      }

      // === AYLIK TREND ===
      if (chartData.monthlyActivity.length > 1) {
        sections.push(
          new Paragraph({ spacing: { before: 400 }, children: [] }),
          new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { after: 120 }, children: [new TextRun({ text: "AYLIK AKTİVİTE TRENDİ", bold: true, size: 24, font: "Calibri", color: "1e3a5f" })] })
        );
        sections.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({ children: [headerCell("Ay", 34), headerCell("Yönlendirme", 22), headerCell("Disiplin", 22), headerCell("Toplam", 22)] }),
            ...chartData.monthlyActivity.map((entry, i) => {
              const total = entry.referrals + entry.discipline;
              return new TableRow({
                children: [
                  cell(entry.month, { width: 34, shading: i % 2 === 0 ? "f9fafb" : "FFFFFF" }),
                  cell(String(entry.referrals), { width: 22, alignment: AlignmentType.CENTER, shading: i % 2 === 0 ? "f9fafb" : "FFFFFF" }),
                  cell(String(entry.discipline), { width: 22, alignment: AlignmentType.CENTER, shading: i % 2 === 0 ? "f9fafb" : "FFFFFF" }),
                  cell(String(total), { width: 22, alignment: AlignmentType.CENTER, shading: i % 2 === 0 ? "f9fafb" : "FFFFFF", bold: true }),
                ]
              });
            })
          ]
        }) as unknown as InstanceType<typeof Paragraph>);
      }

      // === DETAYLI YÖNLENDİRME KAYITLARI ===
      if (referrals.length > 0) {
        sections.push(
          new Paragraph({ spacing: { before: 400 }, children: [] }),
          new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { after: 120 }, children: [new TextRun({ text: "DETAYLI YÖNLENDİRME KAYITLARI", bold: true, size: 24, font: "Calibri", color: "1e3a5f" })] })
        );
        sections.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({ children: [headerCell("#", 6), headerCell("Tarih", 14), headerCell("Neden", 20), headerCell("Öğretmen", 18), headerCell("Not", 42)] }),
            ...referrals.map((r, idx) => {
              const bg = idx % 2 === 0 ? "f9fafb" : "FFFFFF";
              return new TableRow({
                children: [
                  cell(String(idx + 1), { width: 6, alignment: AlignmentType.CENTER, shading: bg }),
                  cell(new Date(r.date).toLocaleDateString('tr-TR'), { width: 14, shading: bg }),
                  cell(r.reason, { width: 20, shading: bg }),
                  cell(r.teacherName, { width: 18, shading: bg }),
                  cell(r.notes || '-', { width: 42, shading: bg, italics: !!r.notes }),
                ]
              });
            })
          ]
        }) as unknown as InstanceType<typeof Paragraph>);
      }

      // === ÖĞRETMEN NOTLARI (ayrı bölüm) ===
      const notesWithContent = referrals.filter(r => r.notes && r.notes.trim() !== '');
      if (notesWithContent.length > 0) {
        sections.push(
          new Paragraph({ spacing: { before: 400 }, children: [] }),
          new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { after: 120 }, children: [new TextRun({ text: "ÖĞRETMEN NOTLARI", bold: true, size: 24, font: "Calibri", color: "1e3a5f" })] })
        );
        notesWithContent.forEach((r, idx) => {
          const dateStr = new Date(r.date).toLocaleDateString('tr-TR');
          sections.push(
            new Paragraph({
              spacing: { before: idx > 0 ? 200 : 80, after: 40 },
              children: [
                new TextRun({ text: `${dateStr} — ${r.teacherName}`, bold: true, size: 20, font: "Calibri", color: "374151" }),
                new TextRun({ text: ` (${r.reason})`, size: 18, font: "Calibri", color: "6b7280" }),
              ]
            }),
            new Paragraph({
              spacing: { after: 80 },
              indent: { left: 360 },
              children: [new TextRun({ text: `"${r.notes}"`, size: 20, font: "Calibri", italics: true, color: "1f2937" })]
            })
          );
        });
      }

      // === DETAYLI DİSİPLİN KAYITLARI ===
      if (disciplineRecords.length > 0) {
        sections.push(
          new Paragraph({ spacing: { before: 400 }, children: [] }),
          new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { after: 120 }, children: [new TextRun({ text: "DETAYLI DİSİPLİN KAYITLARI", bold: true, size: 24, font: "Calibri", color: "1e3a5f" })] })
        );
        sections.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({ children: [headerCell("#", 6), headerCell("Olay Tarihi", 14), headerCell("Ceza Türü", 18), headerCell("Neden", 22), headerCell("Sınıf", 16), headerCell("Not", 24)] }),
            ...disciplineRecords.map((r, idx) => {
              const bg = idx % 2 === 0 ? "f9fafb" : "FFFFFF";
              return new TableRow({
                children: [
                  cell(String(idx + 1), { width: 6, alignment: AlignmentType.CENTER, shading: bg }),
                  cell(r.event_date ? new Date(r.event_date).toLocaleDateString('tr-TR') : '-', { width: 14, shading: bg }),
                  cell(r.penalty_type, { width: 18, shading: bg, bold: true }),
                  cell(r.reason, { width: 22, shading: bg }),
                  cell(r.class_display, { width: 16, shading: bg }),
                  cell(r.notes || '-', { width: 24, shading: bg, italics: !!r.notes }),
                ]
              });
            })
          ]
        }) as unknown as InstanceType<typeof Paragraph>);
      }

      // === FOOTER ===
      sections.push(
        new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 4, color: "d1d5db" } }, spacing: { before: 400 }, children: [] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 }, children: [new TextRun({ text: "Bu rapor RPD Yönlendirme Sistemi tarafından otomatik olarak oluşturulmuştur.", size: 18, font: "Calibri", color: "9ca3af", italics: true })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40 }, children: [new TextRun({ text: `Rapor Tarihi: ${reportDate}`, size: 18, font: "Calibri", color: "9ca3af" })] })
      );

      const doc = new Document({
        sections: [{ properties: { page: { margin: { top: 720, bottom: 720, right: 720, left: 720 } } }, children: sections }]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${selectedStudent.text.replace(/\s+/g, '_')}_geçmiş_raporu.docx`);
      toast.success("Word raporu indirildi!", { id: "word-export" });
    } catch (error) {
      console.error("Word export error:", error);
      toast.error("Word dosyası oluşturulamadı", { id: "word-export" });
    } finally {
      setExportingWord(false);
    }
  };

  // PDF olarak indir (html2pdf.js) — grafik + notlar
  const handleExportPdf = async () => {
    if (totalRecords === 0 || !selectedStudent) {
      toast.error("Dışa aktarılacak kayıt yok");
      return;
    }

    setExportingPdf(true);
    toast.loading("PDF raporu hazırlanıyor...", { id: "pdf-export" });

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const DOMPurify = (await import("isomorphic-dompurify")).default;

      const classDisplay = resolvedClass || classes.find(c => c.value === selectedClass)?.text || "";
      const reportDate = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

      const riskScore = referrals.length + disciplineRecords.length * 2;
      const riskLevel = riskScore >= 10 ? "Yüksek Risk" : riskScore >= 5 ? "Orta Risk" : "Düşük Risk";
      const riskColor = riskScore >= 10 ? "#dc2626" : riskScore >= 5 ? "#d97706" : "#16a34a";

      let firstDate = "", lastDate = "";
      if (referrals.length > 0) {
        const dates = referrals.map(r => new Date(r.date).getTime());
        firstDate = new Date(Math.min(...dates)).toLocaleDateString('tr-TR');
        lastDate = new Date(Math.max(...dates)).toLocaleDateString('tr-TR');
      }

      // Çubuk grafik oluşturucu
      const makeBarChart = (items: { label: string; count: number }[], total: number, color: string) => {
        const maxCount = Math.max(...items.map(i => i.count));
        return items.map(item => {
          const pct = total > 0 ? (item.count / maxCount) * 100 : 0;
          const pctLabel = total > 0 ? ((item.count / total) * 100).toFixed(0) : '0';
          return `
            <div style="display: flex; align-items: center; margin-bottom: 5px; font-size: 11px;">
              <span style="width: 120px; color: #374151; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.label}</span>
              <div style="flex: 1; background: #f3f4f6; border-radius: 4px; height: 20px; margin: 0 8px;">
                <div style="width: ${pct}%; background: ${color}; height: 100%; border-radius: 4px; min-width: ${item.count > 0 ? '20px' : '0'};"></div>
              </div>
              <span style="width: 55px; text-align: right; font-weight: 600; color: #1e3a5f;">${item.count} <span style="font-weight: 400; color: #9ca3af;">(%${pctLabel})</span></span>
            </div>`;
        }).join('');
      };

      let html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 10px;">
          <div style="text-align: center; margin-bottom: 8px;">
            <h1 style="margin: 0; font-size: 20px; color: #1e3a5f; letter-spacing: 1px;">REHBERLİK VE PSİKOLOJİK DANIŞMANLIK SERVİSİ</h1>
            <h2 style="margin: 4px 0 0 0; font-size: 15px; color: #4b5563; font-weight: 500;">Öğrenci Geçmişi Raporu</h2>
          </div>
          <hr style="border: none; border-top: 2px solid #1e3a5f; margin: 10px 0 16px 0;" />

          <div style="background: #f0f4f8; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
            <h3 style="margin: 0 0 10px 0; font-size: 13px; color: #1e3a5f; text-transform: uppercase;">Öğrenci Bilgileri</h3>
            <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
              <tr><td style="padding: 4px 8px; font-weight: 600; width: 200px;">Öğrenci Adı Soyadı</td><td style="padding: 4px 8px;">${selectedStudent.text}</td></tr>
              <tr><td style="padding: 4px 8px; font-weight: 600;">Sınıf / Şube</td><td style="padding: 4px 8px;">${classDisplay}</td></tr>
              <tr><td style="padding: 4px 8px; font-weight: 600;">Toplam Yönlendirme</td><td style="padding: 4px 8px;"><strong style="color: #2563eb;">${referrals.length}</strong></td></tr>
              <tr><td style="padding: 4px 8px; font-weight: 600;">Toplam Disiplin</td><td style="padding: 4px 8px;"><strong style="color: #d97706;">${disciplineRecords.length}</strong></td></tr>
              <tr><td style="padding: 4px 8px; font-weight: 600;">Risk Seviyesi</td><td style="padding: 4px 8px;"><strong style="color: ${riskColor};">${riskLevel}</strong></td></tr>
              ${firstDate ? `<tr><td style="padding: 4px 8px; font-weight: 600;">İlk / Son Yönlendirme</td><td style="padding: 4px 8px;">${firstDate} — ${lastDate}</td></tr>` : ''}
              <tr><td style="padding: 4px 8px; font-weight: 600;">Rapor Tarihi</td><td style="padding: 4px 8px;">${reportDate}</td></tr>
            </table>
          </div>`;

      // GRAFİKLER - Neden ve Ceza Türü yan yana
      const chartSections: string[] = [];

      if (chartData.referralReasons.length > 0) {
        const sorted = [...chartData.referralReasons].sort((a, b) => b.count - a.count);
        chartSections.push(`
          <div style="flex: 1; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
            <h3 style="margin: 0 0 10px 0; font-size: 12px; color: #1e3a5f; text-transform: uppercase;">Yönlendirme Nedenleri</h3>
            ${makeBarChart(sorted.map(e => ({ label: e.reason, count: e.count })), referrals.length, 'linear-gradient(90deg, #3b82f6, #1e40af)')}
          </div>`);
      }

      if (chartData.penaltyTypes.length > 0) {
        const sorted = [...chartData.penaltyTypes].sort((a, b) => b.count - a.count);
        chartSections.push(`
          <div style="flex: 1; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
            <h3 style="margin: 0 0 10px 0; font-size: 12px; color: #92400e; text-transform: uppercase;">Ceza Türleri</h3>
            ${makeBarChart(sorted.map(e => ({ label: e.type, count: e.count })), disciplineRecords.length, 'linear-gradient(90deg, #f59e0b, #d97706)')}
          </div>`);
      }

      if (chartSections.length > 0) {
        html += `<div style="display: flex; gap: 12px; margin-bottom: 16px;">${chartSections.join('')}</div>`;
      }

      // Öğretmen dağılımı grafiği
      if (chartData.teacherReferrals.length > 0) {
        html += `
          <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
            <h3 style="margin: 0 0 10px 0; font-size: 12px; color: #1e3a5f; text-transform: uppercase;">Yönlendiren Öğretmen Dağılımı</h3>
            ${makeBarChart(chartData.teacherReferrals.map(e => ({ label: e.teacher, count: e.count })), referrals.length, 'linear-gradient(90deg, #8b5cf6, #6d28d9)')}
          </div>`;
      }

      // AYLIK TREND
      if (chartData.monthlyActivity.length > 1) {
        const maxCount = Math.max(...chartData.monthlyActivity.map(m => m.referrals + m.discipline));
        html += `
          <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
            <h3 style="margin: 0 0 10px 0; font-size: 12px; color: #1e3a5f; text-transform: uppercase;">Aylık Aktivite Trendi</h3>
            ${chartData.monthlyActivity.map(entry => {
              const total = entry.referrals + entry.discipline;
              const pct = maxCount > 0 ? (total / maxCount) * 100 : 0;
              return `
                <div style="display: flex; align-items: center; margin-bottom: 4px; font-size: 11px;">
                  <span style="width: 80px; color: #374151; font-weight: 500;">${entry.month}</span>
                  <div style="flex: 1; background: #f3f4f6; border-radius: 4px; height: 18px; margin: 0 8px;">
                    <div style="width: ${pct}%; background: linear-gradient(90deg, #3b82f6, #1e3a5f); height: 100%; border-radius: 4px; min-width: ${total > 0 ? '20px' : '0'};"></div>
                  </div>
                  <span style="width: 60px; text-align: right; font-size: 10px; color: #6b7280;">${entry.referrals}Y + ${entry.discipline}D = <strong style="color: #1e3a5f;">${total}</strong></span>
                </div>`;
            }).join('')}
          </div>`;
      }

      // DETAYLI YÖNLENDİRME KAYITLARI
      if (referrals.length > 0) {
        html += `
          <h3 style="margin: 0 0 10px 0; font-size: 13px; color: #1e3a5f; text-transform: uppercase;">Yönlendirme Kayıtları (${referrals.length})</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 16px;">
            <thead><tr style="background: #1e3a5f; color: white;">
              <th style="padding: 6px 8px; text-align: center; width: 25px;">#</th>
              <th style="padding: 6px 8px; text-align: left; width: 70px;">Tarih</th>
              <th style="padding: 6px 8px; text-align: left;">Neden</th>
              <th style="padding: 6px 8px; text-align: left; width: 100px;">Öğretmen</th>
              <th style="padding: 6px 8px; text-align: left;">Not</th>
            </tr></thead><tbody>
            ${referrals.map((r, idx) => `
              <tr style="background: ${idx % 2 === 0 ? '#f9fafb' : '#fff'};">
                <td style="padding: 5px 8px; text-align: center; border-bottom: 1px solid #e5e7eb;">${idx + 1}</td>
                <td style="padding: 5px 8px; border-bottom: 1px solid #e5e7eb;">${new Date(r.date).toLocaleDateString('tr-TR')}</td>
                <td style="padding: 5px 8px; border-bottom: 1px solid #e5e7eb;">${r.reason}</td>
                <td style="padding: 5px 8px; border-bottom: 1px solid #e5e7eb;">${r.teacherName}</td>
                <td style="padding: 5px 8px; border-bottom: 1px solid #e5e7eb; ${r.notes ? 'font-style: italic;' : ''}">${r.notes || '-'}</td>
              </tr>`).join('')}
            </tbody></table>`;
      }

      // ÖĞRETMEN NOTLARI (ayrı bölüm)
      const notesWithContent = referrals.filter(r => r.notes && r.notes.trim() !== '');
      if (notesWithContent.length > 0) {
        html += `
          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
            <h3 style="margin: 0 0 12px 0; font-size: 13px; color: #92400e; text-transform: uppercase;">Öğretmen Notları</h3>
            ${notesWithContent.map((r, idx) => {
              const dateStr = new Date(r.date).toLocaleDateString('tr-TR');
              return `
                <div style="margin-bottom: ${idx < notesWithContent.length - 1 ? '10px' : '0'}; padding-bottom: ${idx < notesWithContent.length - 1 ? '10px' : '0'}; border-bottom: ${idx < notesWithContent.length - 1 ? '1px solid #fde68a' : 'none'};">
                  <div style="font-size: 11px; font-weight: 600; color: #374151;">${dateStr} — ${r.teacherName} <span style="font-weight: 400; color: #9ca3af;">(${r.reason})</span></div>
                  <div style="font-size: 12px; color: #1f2937; font-style: italic; margin-top: 3px; padding-left: 12px; border-left: 3px solid #f59e0b;">"${r.notes}"</div>
                </div>`;
            }).join('')}
          </div>`;
      }

      // DETAYLI DİSİPLİN KAYITLARI
      if (disciplineRecords.length > 0) {
        html += `
          <h3 style="margin: 0 0 10px 0; font-size: 13px; color: #d97706; text-transform: uppercase;">Disiplin Kayıtları (${disciplineRecords.length})</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 16px;">
            <thead><tr style="background: #92400e; color: white;">
              <th style="padding: 6px 8px; text-align: center; width: 25px;">#</th>
              <th style="padding: 6px 8px; text-align: left; width: 70px;">Olay Tarihi</th>
              <th style="padding: 6px 8px; text-align: left;">Ceza Türü</th>
              <th style="padding: 6px 8px; text-align: left;">Neden</th>
              <th style="padding: 6px 8px; text-align: left; width: 80px;">Sınıf</th>
              <th style="padding: 6px 8px; text-align: left;">Not</th>
            </tr></thead><tbody>
            ${disciplineRecords.map((r, idx) => `
              <tr style="background: ${idx % 2 === 0 ? '#fffbeb' : '#fff'};">
                <td style="padding: 5px 8px; text-align: center; border-bottom: 1px solid #fde68a;">${idx + 1}</td>
                <td style="padding: 5px 8px; border-bottom: 1px solid #fde68a;">${r.event_date ? new Date(r.event_date).toLocaleDateString('tr-TR') : '-'}</td>
                <td style="padding: 5px 8px; border-bottom: 1px solid #fde68a; font-weight: 600;">${r.penalty_type}</td>
                <td style="padding: 5px 8px; border-bottom: 1px solid #fde68a;">${r.reason}</td>
                <td style="padding: 5px 8px; border-bottom: 1px solid #fde68a;">${r.class_display}</td>
                <td style="padding: 5px 8px; border-bottom: 1px solid #fde68a; ${r.notes ? 'font-style: italic;' : ''}">${r.notes || '-'}</td>
              </tr>`).join('')}
            </tbody></table>`;
      }

      // FOOTER
      html += `
          <hr style="border: none; border-top: 1px solid #d1d5db; margin: 20px 0 10px 0;" />
          <p style="text-align: center; font-size: 10px; color: #9ca3af; font-style: italic; margin: 0;">
            Bu rapor RPD Yönlendirme Sistemi tarafından otomatik olarak oluşturulmuştur. | Rapor Tarihi: ${reportDate}
          </p>
        </div>`;

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
          filename: `${selectedStudent.text.replace(/\s+/g, '_')}_geçmiş_raporu.pdf`,
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

  return (
    <div className="space-y-6">
      {/* Modern Başlık */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-600 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDF6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        
        {/* Animated Background Elements */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl animate-float-slow" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl animate-float-reverse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-violet-400/10 blur-3xl animate-pulse-glow" />
        
        {/* Floating Particles */}
        <div className="absolute top-8 right-16 h-2 w-2 rounded-full bg-purple-300/60 animate-float animation-delay-100" />
        <div className="absolute top-16 right-32 h-1.5 w-1.5 rounded-full bg-indigo-300/60 animate-float animation-delay-300" />
        <div className="absolute bottom-12 left-24 h-2 w-2 rounded-full bg-violet-300/60 animate-float animation-delay-500" />
        <div className="absolute top-1/3 left-1/5 h-1 w-1 rounded-full bg-white/40 animate-sparkle animation-delay-200" />
        <div className="absolute bottom-1/4 right-1/5 h-1.5 w-1.5 rounded-full bg-pink-300/50 animate-sparkle animation-delay-700" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-lg">
                <History className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  Öğrenci Geçmişi
                </h1>
                <p className="text-white/80 mt-1">
                  Yönlendirme ve disiplin kayıtlarını görüntüleyin, analiz edin
                </p>
              </div>
            </div>
            
            {/* İstatistik Kartları */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-3 py-2 border border-white/10 hover:bg-white/20 transition-all cursor-default">
                <GraduationCap className="h-4 w-4 text-purple-200" />
                <div>
                  <p className="text-[10px] text-purple-200 uppercase tracking-wider">Sınıf</p>
                  <p className="text-lg font-bold leading-none">{classes.length}</p>
                </div>
              </div>
              {selectedStudent && (
                <>
                  <div className="flex items-center gap-2 rounded-lg bg-blue-500/30 backdrop-blur-sm px-3 py-2 border border-blue-400/30 hover:bg-blue-500/40 transition-all cursor-default">
                    <Send className="h-4 w-4 text-blue-200" />
                    <div>
                      <p className="text-[10px] text-blue-200 uppercase tracking-wider">Yönlendirme</p>
                      <p className="text-lg font-bold leading-none">{referrals.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-orange-500/30 backdrop-blur-sm px-3 py-2 border border-orange-400/30 hover:bg-orange-500/40 transition-all cursor-default">
                    <ShieldAlert className="h-4 w-4 text-orange-200" />
                    <div>
                      <p className="text-[10px] text-orange-200 uppercase tracking-wider">Disiplin</p>
                      <p className="text-lg font-bold leading-none">{disciplineRecords.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-500/30 backdrop-blur-sm px-3 py-2 border border-emerald-400/30 hover:bg-emerald-500/40 transition-all cursor-default">
                    <BarChart3 className="h-4 w-4 text-emerald-200" />
                    <div>
                      <p className="text-[10px] text-emerald-200 uppercase tracking-wider">Toplam</p>
                      <p className="text-lg font-bold leading-none">{totalRecords}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Alt bilgi çubuğu - Fonksiyonel */}
          <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Kayıt Tipi Filtre Toggle */}
              <div className="flex items-center bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${
                    activeTab === "all" 
                      ? "bg-white text-purple-600 shadow-sm" 
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  <Activity className="h-3 w-3" />
                  Tümü
                </button>
                <button
                  onClick={() => setActiveTab("referrals")}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${
                    activeTab === "referrals" 
                      ? "bg-white text-purple-600 shadow-sm" 
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  <Send className="h-3 w-3" />
                  Yönlendirme
                </button>
                <button
                  onClick={() => setActiveTab("discipline")}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${
                    activeTab === "discipline" 
                      ? "bg-white text-purple-600 shadow-sm" 
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  <ShieldAlert className="h-3 w-3" />
                  Disiplin
                </button>
              </div>
              
              {/* Seçili Öğrenci */}
              {selectedStudent && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
                    <User className="h-3 w-3 mr-1" />
                    {selectedStudent.text}
                  </Badge>
                  {(resolvedClass || classes.find(c => c.value === selectedClass)?.text) && (
                    <Badge className="bg-white/10 text-white/90 border-0">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      {resolvedClass || classes.find(c => c.value === selectedClass)?.text}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Word Export */}
              {selectedStudent && totalRecords > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportWord}
                  disabled={exportingWord}
                  className="bg-white/10 hover:bg-white/20 text-white border-0"
                >
                  {exportingWord ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
                  Word
                </Button>
              )}

              {/* PDF Export */}
              {selectedStudent && totalRecords > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportPdf}
                  disabled={exportingPdf}
                  className="bg-white/10 hover:bg-white/20 text-white border-0"
                >
                  {exportingPdf ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Printer className="h-4 w-4 mr-1" />}
                  PDF
                </Button>
              )}
              
              {/* Seçimi Temizle */}
              {selectedStudent && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedStudent(null);
                    setSearchQuery("");
                    setResolvedClass("");
                    setSearchMatches([]);
                    setReferrals([]);
                    setDisciplineRecords([]);
                  }}
                  className="bg-red-500/20 hover:bg-red-500/30 text-white border-0"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Temizle
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Arama ve Filtreler */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Sınıf ve Öğrenci Seçimi */}
        <Card className="lg:col-span-4 bg-gradient-to-br from-indigo-50 to-white border-indigo-200 shadow-sm">
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
                <SelectTrigger className="h-10 border-indigo-200 focus:border-indigo-400">
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
                <SelectTrigger className="h-10 border-indigo-200 focus:border-indigo-400">
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
              <div className="p-3 bg-gradient-to-r from-indigo-100 to-violet-100 rounded-xl border border-indigo-200">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-500 rounded-lg">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-indigo-800">
                    {selectedStudent.text}
                  </span>
                </div>
                <p className="text-xs text-indigo-600 mt-1 ml-8">
                  {classes.find(c => c.value === selectedClass)?.text || resolvedClass}
                </p>
                <div className="flex gap-2 mt-2 ml-8">
                  <Badge className="bg-blue-500 text-white border-0">
                    {referrals.length} Yönlendirme
                  </Badge>
                  <Badge className="bg-orange-500 text-white border-0">
                    {disciplineRecords.length} Disiplin
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* İsimle Arama */}
        <Card className="lg:col-span-4 bg-white/80 backdrop-blur shadow-sm">
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
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700"
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

        {/* Hızlı İşlemler */}
        <Card className="lg:col-span-4 bg-gradient-to-br from-slate-50 to-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Activity className="h-5 w-5 text-slate-600" />
              Hızlı İşlemler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                onClick={handleExportWord}
                disabled={totalRecords === 0 || exportingWord}
              >
                {exportingWord ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Word İndir
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleExportPdf}
                disabled={totalRecords === 0 || exportingPdf}
              >
                {exportingPdf ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                PDF İndir
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                className="flex-1 gap-1"
                onClick={() => setViewMode("list")}
              >
                <FileText className="h-4 w-4" />
                Liste
              </Button>
              <Button
                variant={viewMode === "timeline" ? "default" : "outline"}
                size="sm"
                className="flex-1 gap-1"
                onClick={() => setViewMode("timeline")}
              >
                <Activity className="h-4 w-4" />
                Zaman Çizelgesi
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => setShowCharts(!showCharts)}
            >
              <BarChart3 className="h-4 w-4" />
              {showCharts ? "Grafikleri Gizle" : "Grafikleri Göster"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Arama Sonuçları - Birden Fazla Öğrenci */}
      {searchMatches.length > 1 && (
        <Card className="bg-white/80 backdrop-blur shadow-sm border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-amber-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              {searchMatches.length} Farklı Öğrenci Bulundu
              <span className="text-sm font-normal text-slate-500">— lütfen birini seçin</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {searchMatches.map((match, idx) => (
                <button
                  key={`${match.studentName}-${match.classDisplay}-${idx}`}
                  onClick={() => handleSelectMatch(match)}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-md transition-all text-left group"
                >
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-slate-800 truncate">{match.studentName}</p>
                    <p className="text-xs text-slate-500 truncate">{match.classDisplay}</p>
                    <Badge className="mt-1 bg-blue-100 text-blue-700 border-0 text-[10px]">
                      {match.count} yönlendirme
                    </Badge>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 -rotate-90 transition-colors" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grafikler ve İstatistikler */}
      {showCharts && selectedStudent && totalRecords > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Özet Kartı */}
          <HistorySummaryCard
            studentName={selectedStudent.text}
            className={classes.find(c => c.value === selectedClass)?.text || ""}
            totalReferrals={referrals.length}
            totalDiscipline={disciplineRecords.length}
            lastActivityDate={chartData.lastActivity}
          />
          
          {/* Risk Göstergesi */}
          <RiskIndicator
            referralCount={referrals.length}
            disciplineCount={disciplineRecords.length}
          />
          
          {/* Yönlendirme Nedenleri */}
          <ReferralReasonsChart data={chartData.referralReasons} />
          
          {/* Ceza Türleri */}
          <PenaltyTypesChart data={chartData.penaltyTypes} />
        </div>
      )}

      {/* Ek Grafikler */}
      {showCharts && selectedStudent && totalRecords > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <MonthlyActivityChart data={chartData.monthlyActivity} />
          <TeacherReferralsChart data={chartData.teacherReferrals} />
          <ActivityTimeline activities={chartData.activities} />
        </div>
      )}

      {/* Filtre ve Sıralama Toolbar */}
      {(selectedStudent || searchQuery) && !loadingHistory && totalRecords > 0 && viewMode === "list" && (
        <Card className="bg-white/80 backdrop-blur shadow-sm">
          <CardContent className="py-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Filtre:</span>
                <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                  <SelectTrigger className="h-8 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="referral">Yönlendirmeler</SelectItem>
                    <SelectItem value="discipline">Disiplin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Sırala:</span>
                <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
                  <SelectTrigger className="h-8 w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Tarih</SelectItem>
                    <SelectItem value="type">Tür</SelectItem>
                    <SelectItem value="reason">Neden</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
              </div>
              <div className="ml-auto text-sm text-slate-500">
                {totalRecords} kayıt bulundu
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kayıtlar - Liste Görünümü */}
      {viewMode === "list" && (selectedStudent || searchQuery) && !loadingHistory && (
        <div className="space-y-4">
          {/* Yönlendirme Kayıtları */}
          {(filterType === "all" || filterType === "referral") && (
            <Card className="bg-white/80 backdrop-blur shadow-sm">
              <CardHeader className="pb-3">
                <button 
                  onClick={() => setShowReferrals(!showReferrals)}
                  className="w-full flex items-center justify-between"
                >
                  <CardTitle className="text-base font-semibold text-blue-800 flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-blue-600" />
                    </div>
                    Yönlendirme Kayıtları
                    <Badge className="bg-blue-600 text-white ml-2">{referrals.length}</Badge>
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
                          className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all group"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className="bg-blue-600 text-white">
                                  {record.reason}
                                </Badge>
                                <span className="text-xs text-slate-500 px-2 py-0.5 bg-white rounded-full">
                                  {record.classDisplay}
                                </span>
                              </div>
                              <div className="mt-3 flex items-center gap-4 text-sm text-slate-600">
                                <span className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg">
                                  <User className="h-3.5 w-3.5 text-blue-500" />
                                  {record.teacherName}
                                </span>
                                <span className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg">
                                  <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                  {formatDateTime(record.date)}
                                </span>
                              </div>
                              {record.notes && (
                                <p className="mt-3 text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-100">
                                  <span className="font-medium text-slate-700">Not: </span>
                                  {record.notes}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
          )}

          {/* Disiplin Kayıtları */}
          {(filterType === "all" || filterType === "discipline") && (
            <Card className="bg-white/80 backdrop-blur shadow-sm">
              <CardHeader className="pb-3">
                <button 
                  onClick={() => setShowDiscipline(!showDiscipline)}
                  className="w-full flex items-center justify-between"
                >
                  <CardTitle className="text-base font-semibold text-orange-800 flex items-center gap-2">
                    <div className="p-1.5 bg-orange-100 rounded-lg">
                      <Gavel className="h-4 w-4 text-orange-600" />
                    </div>
                    Disiplin Kayıtları
                    <Badge className="bg-orange-600 text-white ml-2">{disciplineRecords.length}</Badge>
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
                          className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100 hover:border-orange-300 hover:shadow-md transition-all group"
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
                              <div className="mt-3 flex items-center gap-4 text-sm text-slate-600">
                                <span className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg">
                                  <GraduationCap className="h-3.5 w-3.5 text-orange-500" />
                                  {record.class_display}
                                </span>
                                <span className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg">
                                  <Calendar className="h-3.5 w-3.5 text-orange-500" />
                                  Olay: {record.event_date ? new Date(record.event_date).toLocaleDateString('tr-TR') : '-'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Kayıt: {formatDateTime(record.created_at)}
                              </p>
                              {record.notes && (
                                <p className="mt-3 text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-100">
                                  <span className="font-medium text-slate-700">Not: </span>
                                  {record.notes}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
          )}
        </div>
      )}

      {/* Zaman Çizelgesi Görünümü */}
      {viewMode === "timeline" && (selectedStudent || searchQuery) && !loadingHistory && totalRecords > 0 && (
        <Card className="bg-white/80 backdrop-blur shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              Tüm Aktiviteler - Zaman Çizelgesi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-4">
              {chartData.activities.map((activity, index) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        activity.type === "referral" 
                          ? "bg-blue-500 border-blue-300" 
                          : "bg-orange-500 border-orange-300"
                      }`}
                    />
                    {index < chartData.activities.length - 1 && (
                      <div className="w-0.5 h-full bg-slate-200 mt-2" />
                    )}
                  </div>
                  <div className={`flex-1 pb-6 p-4 rounded-xl ${
                    activity.type === "referral" 
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100" 
                      : "bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        className={`${
                          activity.type === "referral" 
                            ? "bg-blue-600 text-white" 
                            : "bg-orange-600 text-white"
                        }`}
                      >
                        {activity.type === "referral" ? "Yönlendirme" : "Disiplin"}
                      </Badge>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {activity.date}
                      </span>
                    </div>
                    <p className="font-medium text-slate-800">{activity.title}</p>
                    <p className="text-sm text-slate-600 mt-1">{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Yükleniyor */}
      {loadingHistory && (
        <Card className="bg-white/80 backdrop-blur shadow-sm">
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
        <Card className="bg-white/80 backdrop-blur shadow-sm">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-slate-400">
              <div className="p-4 bg-indigo-100 rounded-2xl mb-4">
                <History className="h-12 w-12 text-indigo-500" />
              </div>
              <p className="text-xl font-semibold text-slate-600">Öğrenci Geçmişi</p>
              <p className="text-sm mt-2 text-center max-w-md">
                Kayıtları görüntülemek için bir öğrenci seçin veya isimle arama yapın.
                Tüm yönlendirme ve disiplin kayıtlarını detaylı olarak inceleyebilirsiniz.
              </p>
              <div className="flex gap-4 mt-6">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Yönlendirmeler</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span>Disiplin Kayıtları</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
