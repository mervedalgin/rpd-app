"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import DOMPurify from "isomorphic-dompurify";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  ClipboardCheck,
  Search,
  Download,
  Eye,
  FileText,
  Users,
  AlertTriangle,
  Calendar,
  RefreshCw,
  GraduationCap,
  User,
  BookOpen,
  Clock,
  Loader2,
  X,
  Check,
  FileDown,
  ChevronDown,
  Activity,
  MessageCircle,
  Phone,
  Plus,
  Trash2,
  PenLine,
  Sparkles,
  History,
  Globe,
  Hash,
  Save,
  BarChart3,
  GitBranch,
  Layout,
  Zap,
  Shield,
  Heart,
  Target,
  ArrowRight,
  ChevronRight,
  PieChart as PieChartIcon,
  Edit3,
  RotateCcw,
  Wand2,
  Copy
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  Document,
  Paragraph,
  TextRun,
  Packer,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel
} from "docx";
import { saveAs } from "file-saver";
import dynamic from "next/dynamic";
import { htmlToDocx } from "./htmlToDocx";

const AdvancedEditor = dynamic(
  () => import("./AdvancedEditor").then((mod) => mod.AdvancedEditor),
  {
    ssr: false,
    loading: () => (
      <div className="border border-slate-200 rounded-2xl bg-white h-[600px] flex items-center justify-center text-slate-400">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
        Gelişmiş editör yükleniyor...
      </div>
    ),
  }
);

// ==================== INTERFACES ====================
interface StudentTutanak {
  student_name: string;
  class_display: string;
  class_key: string;
  teacher_name: string;
  reasons: string[];
  notes: string[];
  referral_count: number;
  first_referral: string;
  last_referral: string;
  uyruk?: string;
  manual?: boolean;
}

interface CaseNote {
  note_type: string;
  content: string;
  note_date: string;
}

interface ManualForm {
  studentName: string;
  classKey: string;
  classDisplay: string;
  teacherName: string;
  uyruk: string;
  selectedReasons: string[];
  customReasons: string[];
  notes: string;
  extraTespitler: string[];
  tutanakDate: string;
}

interface TutanakHistory {
  id: string;
  student_name: string;
  class_display: string;
  teacher_name: string;
  reasons: string[];
  date: string;
  type: "auto" | "manual";
  status: string;
  content_html: string | null;
  template_id: string | null;
  download_count: number;
}

// ==================== SABIT DEGERLER ====================
const REHBER_OGRETMEN = "Mehmet DALGIN";
const MUDUR_YARDIMCISI = "M. Emin YAPICI";
const OKUL_ADI = "Dumlupınar İlkokulu";
const OKUL_MUDURLUBU = "DUMLUPINAR İLKOKULU MÜDÜRLÜĞÜ";
const ILCE = "Birecik Kaymakamlığı";
const IL = "Şanlıurfa";

const TUTANAK_NEDENLERI = [
  "Devamsızlık Yapan",
  "Rehberliğe İhtiyaç Duyan",
  "Göçmen / Mülteci (Suriyeli)",
  "Akran Zorbalığı Yapan",
  "Ailevi Travması Olan",
  "Psikolojik Danışmaya İhtiyaç Duyan",
  "RAM'a yönlendirilmesi gereken",
  "Maddi Durumu Yetersiz",
  "Sınıf Kurallarına Uymayan",
  "Özel Gereksinimli",
  "Dil Engeli / Türkçe Bilmemesi",
  "Okul ve Sınıf Uyum Sorunu",
  "Dikkat Dağınıklığı",
  "Veli İlgisizliği",
  "Kişisel Hijyen Sorunu",
  "Akademik Yetersizlik / Gerikalma",
  "Yazı Yazmaya Direnç",
  "Derse İlgisizlik / Pasif Tutum",
  "Çekingenlik / İletişim Güçlüğü",
  "Öksüz / Yetim"
] as const;

const UYRUK_OPTIONS = [
  "T.C.",
  "Suriye Uyruklu",
  "Irak Uyruklu",
  "Afganistan Uyruklu",
  "Diğer"
];

// Tutanak geçmişi artık Supabase'de (academic_tutanaks tablosu)

// ==================== TUTANAK ŞABLONLARI ====================
interface TutanakTemplate {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  defaultReasons: string[];
  defaultUyruk: string;
  tespitPrefix: string;
  kanaatExtra: string;
}

const TUTANAK_SABLONLARI: TutanakTemplate[] = [
  {
    id: "devamsizlik",
    label: "Devamsızlık Tutanağı",
    description: "Süregelen devamsızlık sorunu olan öğrenciler için",
    icon: Calendar,
    color: "red",
    gradient: "from-red-500 to-rose-600",
    defaultReasons: ["Devamsızlık Yapan"],
    defaultUyruk: "T.C.",
    tespitPrefix: "Devamsızlık kayıtlarının incelenmesi sonucunda",
    kanaatExtra: "Devamsızlık sorununun ivedilikle çözülmesi için gerekli tedbirlerin alınması,",
  },
  {
    id: "dil-engeli",
    label: "Dil Engeli Tutanağı",
    description: "Türkçe bilmeyen veya yetersiz olan öğrenciler için",
    icon: Globe,
    color: "purple",
    gradient: "from-purple-500 to-violet-600",
    defaultReasons: ["Dil Engeli / Türkçe Bilmemesi", "Göçmen / Mülteci (Suriyeli)", "Okul ve Sınıf Uyum Sorunu"],
    defaultUyruk: "Suriye Uyruklu",
    tespitPrefix: "Yapılan gözlem ve değerlendirmeler sonucunda",
    kanaatExtra: "Türkçe dil becerilerinin geliştirilmesi amacıyla yoğunlaştırılmış destek programına alınması,",
  },
  {
    id: "veli-gorusme",
    label: "Veli Görüşme Tutanağı",
    description: "Veli ile yapılan görüşme sonrası düzenlenen tutanak",
    icon: Phone,
    color: "blue",
    gradient: "from-blue-500 to-indigo-600",
    defaultReasons: ["Veli İlgisizliği"],
    defaultUyruk: "T.C.",
    tespitPrefix: "Veli ile yapılan görüşmede",
    kanaatExtra: "Velinin eğitim sürecine aktif katılımının sağlanması,",
  },
  {
    id: "akademik-gerikalma",
    label: "Akademik Gerikalma Tutanağı",
    description: "Akademik başarısı düşük, sınıf seviyesinin altında kalan öğrenciler",
    icon: GraduationCap,
    color: "amber",
    gradient: "from-amber-500 to-orange-600",
    defaultReasons: ["Akademik Yetersizlik / Gerikalma", "Derse İlgisizlik / Pasif Tutum"],
    defaultUyruk: "T.C.",
    tespitPrefix: "Akademik değerlendirme sonucunda",
    kanaatExtra: "Akademik destek programına dahil edilmesi ve bireysel çalışma planı oluşturulması,",
  },
  {
    id: "davranis",
    label: "Davranış Sorunları Tutanağı",
    description: "Sınıf kurallarına uymayan, zorbalık veya uyum sorunu yaşayan öğrenciler",
    icon: Shield,
    color: "rose",
    gradient: "from-rose-500 to-red-600",
    defaultReasons: ["Sınıf Kurallarına Uymayan", "Akran Zorbalığı Yapan"],
    defaultUyruk: "T.C.",
    tespitPrefix: "Sınıf gözlemleri ve öğretmen bildirimleri doğrultusunda",
    kanaatExtra: "Davranış düzenleme çalışmalarına başlanması ve gerekirse bireysel görüşmelerin planlanması,",
  },
  {
    id: "risk",
    label: "Risk Altındaki Öğrenci Tutanağı",
    description: "Ailevi travma, maddi yetersizlik veya özel gereksinimi olan öğrenciler",
    icon: Heart,
    color: "pink",
    gradient: "from-pink-500 to-rose-600",
    defaultReasons: ["Ailevi Travması Olan", "Maddi Durumu Yetersiz"],
    defaultUyruk: "T.C.",
    tespitPrefix: "Yapılan sosyal inceleme ve değerlendirme sonucunda",
    kanaatExtra: "Öğrencinin psikososyal destek programına alınması ve gerekli kurum yönlendirmelerinin yapılması,",
  },
  {
    id: "bos",
    label: "Boş Şablon",
    description: "Sıfırdan kendi tutanağınızı oluşturun",
    icon: FileText,
    color: "slate",
    gradient: "from-slate-500 to-gray-600",
    defaultReasons: [],
    defaultUyruk: "T.C.",
    tespitPrefix: "",
    kanaatExtra: "",
  },
];

const CHART_COLORS = ["#0d9488", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"];

// ==================== YARDIMCI FONKSIYONLAR ====================
const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatDateLong = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
};

const getReasonColor = (reason: string): string => {
  if (reason.includes("Devamsızlık")) return "bg-red-100 text-red-700 border-red-200";
  if (reason.includes("Rehberliğe")) return "bg-blue-100 text-blue-700 border-blue-200";
  if (reason.includes("Zorbalık")) return "bg-orange-100 text-orange-700 border-orange-200";
  if (reason.includes("Göçmen") || reason.includes("Mülteci")) return "bg-purple-100 text-purple-700 border-purple-200";
  if (reason.includes("RAM")) return "bg-indigo-100 text-indigo-700 border-indigo-200";
  if (reason.includes("Psikolojik")) return "bg-pink-100 text-pink-700 border-pink-200";
  if (reason.includes("Travma")) return "bg-rose-100 text-rose-700 border-rose-200";
  if (reason.includes("Maddi")) return "bg-amber-100 text-amber-700 border-amber-200";
  if (reason.includes("Dil Engeli")) return "bg-violet-100 text-violet-700 border-violet-200";
  if (reason.includes("Uyum")) return "bg-cyan-100 text-cyan-700 border-cyan-200";
  if (reason.includes("Dikkat")) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  if (reason.includes("Hijyen")) return "bg-lime-100 text-lime-700 border-lime-200";
  if (reason.includes("Akademik")) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
};

const getReasonIcon = (reason: string) => {
  if (reason.includes("Devamsızlık")) return <Calendar className="h-3 w-3" />;
  if (reason.includes("Rehberliğe")) return <BookOpen className="h-3 w-3" />;
  if (reason.includes("Zorbalık")) return <AlertTriangle className="h-3 w-3" />;
  if (reason.includes("Göçmen") || reason.includes("Mülteci")) return <Globe className="h-3 w-3" />;
  if (reason.includes("Dil Engeli")) return <MessageCircle className="h-3 w-3" />;
  if (reason.includes("Akademik")) return <GraduationCap className="h-3 w-3" />;
  return <Activity className="h-3 w-3" />;
};

const getSeverityLevel = (reasons: string[]): { level: string; color: string; bg: string } => {
  const highSeverity = ["Zorbalık", "Travma", "Psikolojik", "RAM"];
  const medSeverity = ["Devamsızlık", "Maddi", "Dil Engeli", "Akademik"];
  const hasHigh = reasons.some(r => highSeverity.some(h => r.includes(h)));
  const hasMed = reasons.some(r => medSeverity.some(m => r.includes(m)));

  if (hasHigh || reasons.length >= 4) return { level: "Yüksek", color: "text-red-600", bg: "bg-red-500" };
  if (hasMed || reasons.length >= 2) return { level: "Orta", color: "text-amber-600", bg: "bg-amber-500" };
  return { level: "Düşük", color: "text-emerald-600", bg: "bg-emerald-500" };
};

// ==================== TESPIT EDILEN HUSUSLAR ÜRETICI ====================
function generateTespitler(student: StudentTutanak, notes: CaseNote[]): string[] {
  const tespitler: string[] = [];

  for (const reason of student.reasons) {
    if (reason.includes("Devamsızlık")) {
      tespitler.push(
        `Öğrencinin süregelen devamsızlık problemi tespit edilmiştir. Yapılan incelemelerde öğrencinin düzenli olarak okula devam etmediği, bu durumun akademik süreçte ciddi bir kesintiye yol açtığı belirlenmiştir.`
      );
    }
    if (reason.includes("Rehberliğe")) {
      tespitler.push(
        `Sınıf öğretmeninin gözlem ve değerlendirmelerine göre öğrencinin rehberlik desteğine ihtiyaç duyduğu tespit edilmiştir.`
      );
    }
    if (reason.includes("Göçmen") || reason.includes("Mülteci") || reason.includes("Suriyeli")) {
      tespitler.push(
        `Öğrencinin Türkçe dil becerileri yeterli düzeyde olmayıp, dil engeli nedeniyle dersleri takip etmekte güçlük çektiği, bu durumun sınıf içi uyum sürecini olumsuz etkilediği gözlemlenmiştir.`
      );
    }
    if (reason.includes("Dil Engeli") && !reason.includes("Göçmen") && !reason.includes("Mülteci")) {
      tespitler.push(
        `Öğrencinin Türkçe dil becerilerinde yetersizlik tespit edilmiş olup, okuma-yazma ve anlama becerilerinin geliştirilmesi için ek destek ihtiyacı belirlenmiştir.`
      );
    }
    if (reason.includes("Zorbalık")) {
      tespitler.push(
        `Öğrencinin akranlarıyla ilişkilerinde zorbalık davranışı sergilediği rapor edilmiş olup, bu durum sınıf iklimi ve diğer öğrencilerin güvenliği açısından değerlendirilmeye alınmıştır.`
      );
    }
    if (reason.includes("Travma")) {
      tespitler.push(
        `Ailevi travma geçmişi bulunan öğrencinin okul ortamında duygusal zorluklar yaşadığı, bu durumun akademik performansını ve sosyal uyumunu olumsuz yönde etkilediği gözlemlenmiştir.`
      );
    }
    if (reason.includes("Psikolojik")) {
      tespitler.push(
        `Öğrencinin psikolojik danışmanlık desteğine ihtiyaç duyduğu değerlendirilmiş olup, gerekli yönlendirmenin yapılması planlanmıştır.`
      );
    }
    if (reason.includes("Maddi")) {
      tespitler.push(
        `Öğrencinin maddi durumunun yetersiz olduğu tespit edilmiş olup, okul içi ve dışı destek mekanizmalarının değerlendirilmesi gündeme alınmıştır.`
      );
    }
    if (reason.includes("RAM")) {
      tespitler.push(
        `Öğrencinin RAM (Rehberlik ve Araştırma Merkezi) yönlendirmesinin uygun olacağı değerlendirilmiştir.`
      );
    }
    if (reason.includes("Kurallarına")) {
      tespitler.push(
        `Öğrencinin sınıf kurallarına uyum konusunda güçlükler yaşadığı, ders sürecinde uyumsuz davranışlar sergilediği gözlemlenmiştir.`
      );
    }
    if (reason.includes("Uyum Sorunu") && !reason.includes("Kurallarına")) {
      tespitler.push(
        `Öğrencinin okul ve sınıf ortamına uyum sağlamakta güçlük çektiği, sosyal etkileşimlerinde çekingenlik sergilediği gözlemlenmiştir.`
      );
    }
    if (reason.includes("Dikkat")) {
      tespitler.push(
        `Öğrencinin ders sürecinde dikkat dağınıklığı yaşadığı, verilen yönergeleri takip etmekte güçlük çektiği tespit edilmiştir.`
      );
    }
    if (reason.includes("Veli İlgisizliği")) {
      tespitler.push(
        `Öğrencinin velisinin okul ile yeterli iletişim kurmadığı, eğitim sürecine katılımının yetersiz kaldığı belirlenmiştir.`
      );
    }
    if (reason.includes("Hijyen")) {
      tespitler.push(
        `Öğrencinin kişisel bakım ve hijyen konusunda desteğe ihtiyaç duyduğu gözlemlenmiştir.`
      );
    }
    if (reason.includes("Akademik")) {
      tespitler.push(
        `Öğrencinin akademik performansının sınıf düzeyinin altında olduğu, temel beceriler konusunda gerikalma yaşadığı tespit edilmiştir.`
      );
    }
    if (reason.includes("Yazı")) {
      tespitler.push(
        `Öğrencinin yazı yazma etkinliklerine karşı direnç gösterdiği, yazılı çalışmalara katılım konusunda isteksiz davrandığı gözlemlenmiştir.`
      );
    }
    if (reason.includes("İlgisizlik") || reason.includes("Pasif")) {
      tespitler.push(
        `Öğrencinin derslere karşı ilgisiz ve pasif bir tutum sergilediği, motivasyon eksikliği yaşadığı gözlemlenmiştir.`
      );
    }
    if (reason.includes("Çekingenlik")) {
      tespitler.push(
        `Öğrencinin sosyal ortamlarda çekingenlik gösterdiği, akran ve öğretmen iletişiminde güçlük yaşadığı tespit edilmiştir.`
      );
    }
    if (reason.includes("Öksüz") || reason.includes("Yetim")) {
      tespitler.push(
        `Öğrencinin aile yapısındaki kayıp nedeniyle duygusal destek ihtiyacı olduğu değerlendirilmiştir.`
      );
    }
    if (reason.includes("Özel Gereksinimli")) {
      tespitler.push(
        `Öğrencinin özel eğitim ihtiyacı olduğu tespit edilmiş olup, bireyselleştirilmiş eğitim planı kapsamında değerlendirilmesi uygun görülmüştür.`
      );
    }
  }

  // Notlardan ek tespitler
  for (const note of student.notes) {
    if (note && note.length > 10) {
      tespitler.push(note);
    }
  }

  // Vaka notlarından tespitler
  for (const cn of notes) {
    if (cn.content && cn.content.length > 10) {
      const prefix = cn.note_type === "gozlem" ? "Yapılan gözlemde: " :
                     cn.note_type === "gorusme" ? "Yapılan görüşmede: " :
                     cn.note_type === "degerlendirme" ? "Değerlendirme sonucunda: " : "";
      tespitler.push(prefix + cn.content);
    }
  }

  return tespitler;
}

// ==================== ORTAK KANAAT ÜRETICI ====================
function generateKanaat(student: StudentTutanak): string {
  const parts: string[] = [];

  parts.push(
    `Yukarıda tespit edilen hususlar doğrultusunda, ${student.student_name} adlı öğrencinin akademik ve sosyal gelişim sürecinin yakından takip edilmesi gerektiği kanaatine varılmıştır.`
  );

  if (student.reasons.some(r => r.includes("Devamsızlık"))) {
    parts.push("Devamsızlık sorununun giderilmesi için veli ile düzenli iletişim kurulması,");
  }
  if (student.reasons.some(r => r.includes("Göçmen") || r.includes("Mülteci") || r.includes("Suriyeli") || r.includes("Dil Engeli"))) {
    parts.push("Türkçe dil becerilerinin geliştirilmesi amacıyla ek destek sağlanması,");
  }
  if (student.reasons.some(r => r.includes("Rehberliğe"))) {
    parts.push("Bireysel rehberlik çalışmalarının planlanması ve uygulanması,");
  }
  if (student.reasons.some(r => r.includes("RAM"))) {
    parts.push("RAM'a yönlendirme sürecinin başlatılması,");
  }
  if (student.reasons.some(r => r.includes("Psikolojik"))) {
    parts.push("Psikolojik danışmanlık desteğinin sağlanması,");
  }
  if (student.reasons.some(r => r.includes("Akademik"))) {
    parts.push("Akademik destek programlarına dahil edilmesi,");
  }
  if (student.reasons.some(r => r.includes("Veli İlgisizliği"))) {
    parts.push("Veli ile görüşme yapılarak eğitim sürecine katılımının artırılması,");
  }

  parts.push("öğrencinin okul ortamında desteklenmesi uygun görülmüştür.");

  return parts.join(" ");
}

// ==================== DOCX OLUŞTURUCU ====================
async function generateDocx(student: StudentTutanak, caseNotes: CaseNote[], customDate?: string): Promise<void> {
  const today = customDate || new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const tespitler = generateTespitler(student, caseNotes);
  const kanaat = generateKanaat(student);

  const noBorder = {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  };

  const thinBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
  };

  // Uyruk satırı (varsa)
  const uyrukRow = student.uyruk && student.uyruk !== "T.C." ? [
    new TableRow({
      children: [
        new TableCell({
          borders: thinBorder,
          width: { size: 35, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: "Uyruk / Milliyet", bold: true, size: 20, font: "Times New Roman" })] })],
        }),
        new TableCell({
          borders: thinBorder,
          width: { size: 65, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: student.uyruk, size: 20, font: "Times New Roman" })] })],
        }),
      ],
    }),
  ] : [];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children: [
          // Başlık Bloğu
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: "T.C.", bold: true, size: 22, font: "Times New Roman" })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: ILCE.toUpperCase(), bold: true, size: 22, font: "Times New Roman" })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: OKUL_MUDURLUBU, bold: true, size: 22, font: "Times New Roman" })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: "REHBERLİK SERVİSİ", bold: true, size: 22, font: "Times New Roman" })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "AKADEMİK DURUM TESPİT TUTANAĞI", bold: true, size: 24, font: "Times New Roman", underline: {} })] }),

          // Bilgi Tablosu
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ borders: thinBorder, width: { size: 35, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Öğrencinin Adı Soyadı", bold: true, size: 20, font: "Times New Roman" })] })] }),
                  new TableCell({ borders: thinBorder, width: { size: 65, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: student.student_name, size: 20, font: "Times New Roman" })] })] }),
                ],
              }),
              ...uyrukRow,
              new TableRow({
                children: [
                  new TableCell({ borders: thinBorder, children: [new Paragraph({ children: [new TextRun({ text: "Okul / Sınıf", bold: true, size: 20, font: "Times New Roman" })] })] }),
                  new TableCell({ borders: thinBorder, children: [new Paragraph({ children: [new TextRun({ text: `${OKUL_ADI} / ${student.class_display}`, size: 20, font: "Times New Roman" })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: thinBorder, children: [new Paragraph({ children: [new TextRun({ text: "Sınıf Öğretmeni", bold: true, size: 20, font: "Times New Roman" })] })] }),
                  new TableCell({ borders: thinBorder, children: [new Paragraph({ children: [new TextRun({ text: student.teacher_name, size: 20, font: "Times New Roman" })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: thinBorder, children: [new Paragraph({ children: [new TextRun({ text: "Tutanak Tarihi", bold: true, size: 20, font: "Times New Roman" })] })] }),
                  new TableCell({ borders: thinBorder, children: [new Paragraph({ children: [new TextRun({ text: today, size: 20, font: "Times New Roman" })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: thinBorder, children: [new Paragraph({ children: [new TextRun({ text: "Düzenleyen Birim", bold: true, size: 20, font: "Times New Roman" })] })] }),
                  new TableCell({ borders: thinBorder, children: [new Paragraph({ children: [new TextRun({ text: "Rehberlik Servisi", size: 20, font: "Times New Roman" })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: thinBorder, children: [new Paragraph({ children: [new TextRun({ text: "Yönlendirme Nedeni", bold: true, size: 20, font: "Times New Roman" })] })] }),
                  new TableCell({ borders: thinBorder, children: [new Paragraph({ children: [new TextRun({ text: student.reasons.join(", "), size: 20, font: "Times New Roman" })] })] }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 200 }, children: [] }),

          // I. Tutanağı Düzenleyen Kişiler
          new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { after: 100 }, children: [new TextRun({ text: "I. TUTANAĞI DÜZENLEYEN KİŞİLER", bold: true, size: 22, font: "Times New Roman" })] }),
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: `Bu tutanak; ${OKUL_ADI} Rehberlik Servisi Psikolojik Danışmanı ${REHBER_OGRETMEN}, sınıf öğretmeni ${student.teacher_name} ve müdür yardımcısı ${MUDUR_YARDIMCISI} tarafından ortaklaşa düzenlenmiştir.`, size: 20, font: "Times New Roman" })],
          }),

          // II. Tespit Edilen Hususlar
          new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { after: 100 }, children: [new TextRun({ text: "II. TESPİT EDİLEN HUSUSLAR", bold: true, size: 22, font: "Times New Roman" })] }),
          ...tespitler.map((t, i) =>
            new Paragraph({
              spacing: { after: 100 },
              children: [
                new TextRun({ text: `${i + 1}. `, bold: true, size: 20, font: "Times New Roman" }),
                new TextRun({ text: t, size: 20, font: "Times New Roman" }),
              ],
            })
          ),

          new Paragraph({ spacing: { after: 200 }, children: [] }),

          // III. Ortak Kanaat ve Sonuç
          new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { after: 100 }, children: [new TextRun({ text: "III. ORTAK KANAAT VE SONUÇ", bold: true, size: 22, font: "Times New Roman" })] }),
          new Paragraph({ spacing: { after: 300 }, children: [new TextRun({ text: kanaat, size: 20, font: "Times New Roman" })] }),

          // İmza Tablosu
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ borders: noBorder, width: { size: 25, type: WidthType.PERCENTAGE }, children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Rehber Öğretmen", bold: true, size: 18, font: "Times New Roman" })] }),
                    new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: REHBER_OGRETMEN, size: 18, font: "Times New Roman" })] }),
                  ] }),
                  new TableCell({ borders: noBorder, width: { size: 25, type: WidthType.PERCENTAGE }, children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Sınıf Öğretmeni", bold: true, size: 18, font: "Times New Roman" })] }),
                    new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: student.teacher_name, size: 18, font: "Times New Roman" })] }),
                  ] }),
                  new TableCell({ borders: noBorder, width: { size: 25, type: WidthType.PERCENTAGE }, children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Müdür Yardımcısı", bold: true, size: 18, font: "Times New Roman" })] }),
                    new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: MUDUR_YARDIMCISI, size: 18, font: "Times New Roman" })] }),
                  ] }),
                  new TableCell({ borders: noBorder, width: { size: 25, type: WidthType.PERCENTAGE }, children: [
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Öğrenci Velisi", bold: true, size: 18, font: "Times New Roman" })] }),
                    new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "........................", size: 18, font: "Times New Roman" })] }),
                  ] }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `Akademik_Tutanak_${student.student_name.replace(/\s+/g, "_")}_${today.replace(/\./g, "-")}.docx`;
  saveAs(blob, fileName);
}

// ==================== TUTANAK HTML ÜRETICI (Editör için) ====================
function generateTutanakHtml(student: StudentTutanak, caseNotesList: CaseNote[]): string {
  const today = new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const tespitler = generateTespitler(student, caseNotesList);
  const kanaat = generateKanaat(student);

  const uyrukRow = student.uyruk && student.uyruk !== "T.C."
    ? `<tr><td><strong>Uyruk / Milliyet</strong></td><td>${student.uyruk}</td></tr>`
    : "";

  return `
<p style="text-align: center"><strong>T.C.</strong></p>
<p style="text-align: center"><strong>${ILCE.toUpperCase()}</strong></p>
<p style="text-align: center"><strong>${OKUL_MUDURLUBU}</strong></p>
<p style="text-align: center"><strong>REHBERLİK SERVİSİ</strong></p>
<p style="text-align: center"><strong><u>AKADEMİK DURUM TESPİT TUTANAĞI</u></strong></p>
<p></p>
<table>
<tr><td><strong>Öğrencinin Adı Soyadı</strong></td><td>${student.student_name}</td></tr>
${uyrukRow}
<tr><td><strong>Okul / Sınıf</strong></td><td>${OKUL_ADI} / ${student.class_display}</td></tr>
<tr><td><strong>Sınıf Öğretmeni</strong></td><td>${student.teacher_name}</td></tr>
<tr><td><strong>Tutanak Tarihi</strong></td><td>${today}</td></tr>
<tr><td><strong>Düzenleyen Birim</strong></td><td>Rehberlik Servisi</td></tr>
<tr><td><strong>Yönlendirme Nedeni</strong></td><td>${student.reasons.join(", ")}</td></tr>
</table>
<p></p>
<h2><strong>I. TUTANAĞI DÜZENLEYEN KİŞİLER</strong></h2>
<p>Bu tutanak; ${OKUL_ADI} Rehberlik Servisi Psikolojik Danışmanı <strong>${REHBER_OGRETMEN}</strong>, sınıf öğretmeni <strong>${student.teacher_name}</strong> ve müdür yardımcısı <strong>${MUDUR_YARDIMCISI}</strong> tarafından ortaklaşa düzenlenmiştir.</p>
<p></p>
<h2><strong>II. TESPİT EDİLEN HUSUSLAR</strong></h2>
<ol>
${tespitler.map((t) => `<li>${t}</li>`).join("\n")}
</ol>
<p></p>
<h2><strong>III. ORTAK KANAAT VE SONUÇ</strong></h2>
<p>${kanaat}</p>
<p></p>
<p></p>
<table>
<tr>
<td style="text-align: center"><strong>Rehber Öğretmen</strong><br/><br/><br/>${REHBER_OGRETMEN}</td>
<td style="text-align: center"><strong>Sınıf Öğretmeni</strong><br/><br/><br/>${student.teacher_name}</td>
<td style="text-align: center"><strong>Müdür Yardımcısı</strong><br/><br/><br/>${MUDUR_YARDIMCISI}</td>
<td style="text-align: center"><strong>Öğrenci Velisi</strong><br/><br/><br/>........................</td>
</tr>
</table>
`.trim();
}

// ==================== ANIMATION VARIANTS ====================
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

const cardHover = {
  rest: { scale: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  hover: { scale: 1.01, boxShadow: "0 8px 30px rgba(0,0,0,0.12)", transition: { duration: 0.2 } },
};

const slideIn = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } },
};

// ==================== FORM INITIAL STATE ====================
const initialForm: ManualForm = {
  studentName: "",
  classKey: "",
  classDisplay: "",
  teacherName: "",
  uyruk: "T.C.",
  selectedReasons: [],
  customReasons: [],
  notes: "",
  extraTespitler: [],
  tutanakDate: new Date().toISOString().slice(0, 10),
};

// ==================== ANA BILEŞEN ====================
export default function AkademikTutanakPage() {
  const [students, setStudents] = useState<StudentTutanak[]>([]);
  const [caseNotes, setCaseNotes] = useState<Record<string, CaseNote[]>>({});
  const [parentContacts, setParentContacts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("liste");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState<string | null>(null);
  const [previewStudent, setPreviewStudent] = useState<StudentTutanak | null>(null);

  // Şablon & zaman çizelgesi state
  const [selectedTemplate, setSelectedTemplate] = useState<TutanakTemplate | null>(null);
  const [timelineStudent, setTimelineStudent] = useState<string>("");

  // Editör state
  const [editorContent, setEditorContent] = useState("");
  const [editorStudentName, setEditorStudentName] = useState("");
  const [editorOriginalContent, setEditorOriginalContent] = useState("");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // Manuel form state
  const [form, setForm] = useState<ManualForm>(initialForm);
  const [classes, setClasses] = useState<{ value: string; text: string }[]>([]);
  const [teachers, setTeachers] = useState<{ value: string; label: string; sinifSubeKey?: string; sinifSubeDisplay?: string }[]>([]);
  const [classStudents, setClassStudents] = useState<{ value: string; text: string }[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [customReasonInput, setCustomReasonInput] = useState("");
  const [extraTespitInput, setExtraTespitInput] = useState("");
  const [formStep, setFormStep] = useState(1);

  // Tutanak geçmişi (Supabase)
  const [history, setHistory] = useState<TutanakHistory[]>([]);

  const saveToHistory = useCallback(async (entry: Omit<TutanakHistory, "id" | "status" | "content_html" | "template_id" | "download_count"> & { content_html?: string; template_id?: string }) => {
    try {
      const res = await fetch("/api/akademik-tutanak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_name: entry.student_name,
          class_display: entry.class_display,
          teacher_name: entry.teacher_name,
          reasons: entry.reasons,
          type: entry.type,
          content_html: entry.content_html || null,
          template_id: entry.template_id || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const newEntry: TutanakHistory = {
          id: data.tutanak.id,
          student_name: data.tutanak.student_name,
          class_display: data.tutanak.class_display || "",
          teacher_name: data.tutanak.teacher_name || "",
          reasons: data.tutanak.reasons || [],
          date: data.tutanak.created_at,
          type: data.tutanak.type || "auto",
          status: data.tutanak.status || "created",
          content_html: data.tutanak.content_html,
          template_id: data.tutanak.template_id,
          download_count: data.tutanak.download_count || 1,
        };
        setHistory((prev) => [newEntry, ...prev]);
      }
    } catch (error) {
      console.error("Save tutanak error:", error);
    }
  }, []);

  const deleteFromHistory = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/akademik-tutanak?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setHistory((prev) => prev.filter((h) => h.id !== id));
        toast.success("Tutanak silindi");
      } else {
        toast.error("Tutanak silinemedi");
      }
    } catch {
      toast.error("Silme hatası");
    }
  }, []);

  const clearHistory = useCallback(async () => {
    for (const h of history) {
      await fetch(`/api/akademik-tutanak?id=${h.id}`, { method: "DELETE" });
    }
    setHistory([]);
    toast.success("Tutanak geçmişi temizlendi");
  }, [history]);

  // Veri yükleme
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [tutanakRes, dataRes, teachersRes] = await Promise.all([
        fetch("/api/akademik-tutanak"),
        fetch("/api/data"),
        fetch("/api/teachers"),
      ]);

      if (tutanakRes.ok) {
        const data = await tutanakRes.json();
        setStudents(data.students || []);
        setCaseNotes(data.caseNotes || {});
        setParentContacts(data.parentContacts || {});
        if (Array.isArray(data.tutanakHistory)) {
          setHistory(data.tutanakHistory);
        }
      }

      if (dataRes.ok) {
        const data = await dataRes.json();
        if (Array.isArray(data.sinifSubeList)) setClasses(data.sinifSubeList);
      }

      if (teachersRes.ok) {
        const data = await teachersRes.json();
        if (Array.isArray(data.teachers)) {
          setTeachers(data.teachers.map((t: { value: string; label: string; sinifSubeKey?: string; sinifSubeDisplay?: string }) => ({
            value: t.value,
            label: t.label,
            sinifSubeKey: t.sinifSubeKey,
            sinifSubeDisplay: t.sinifSubeDisplay,
          })));
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Sınıf değiştiğinde öğrencileri yükle
  const loadStudents = useCallback(async (classKey: string) => {
    if (!classKey) { setClassStudents([]); return; }
    try {
      setLoadingStudents(true);
      const res = await fetch(`/api/students?sinifSube=${encodeURIComponent(classKey)}`);
      if (res.ok) {
        const data = await res.json();
        setClassStudents(Array.isArray(data) ? data : Array.isArray(data.ogrenciler) ? data.ogrenciler : []);
      }
    } catch { /* ignore */ } finally {
      setLoadingStudents(false);
    }
  }, []);

  // Filtreleme
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.student_name.toLowerCase().includes(q) ||
        s.class_display.toLowerCase().includes(q) ||
        s.teacher_name.toLowerCase().includes(q) ||
        s.reasons.some((r) => r.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  // İstatistikler
  const stats = useMemo(() => {
    const totalStudents = students.length;
    const totalReasons = new Set(students.flatMap((s) => s.reasons)).size;
    const devamsizlik = students.filter((s) => s.reasons.some((r) => r.includes("Devamsızlık"))).length;
    const rehberlik = students.filter((s) => s.reasons.some((r) => r.includes("Rehberliğe"))).length;
    return { totalStudents, totalReasons, devamsizlik, rehberlik };
  }, [students]);

  const toggleCard = (name: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // DOCX indirme (otomatik)
  const handleDownload = async (student: StudentTutanak) => {
    try {
      setGenerating(student.student_name);
      const notes = caseNotes[student.student_name] || [];
      await generateDocx(student, notes);
      const contentHtml = generateTutanakHtml(student, notes);
      saveToHistory({
        student_name: student.student_name,
        class_display: student.class_display,
        teacher_name: student.teacher_name,
        reasons: student.reasons,
        date: new Date().toISOString(),
        type: student.manual ? "manual" : "auto",
        content_html: contentHtml,
      });
      toast.success(`${student.student_name} tutanağı indirildi`);
    } catch (error) {
      console.error("DOCX error:", error);
      toast.error("Tutanak oluşturulurken hata oluştu");
    } finally {
      setGenerating(null);
    }
  };

  // Toplu indirme
  const handleBulkDownload = async () => {
    const targets = filteredStudents.length > 0 ? filteredStudents : students;
    if (targets.length === 0) { toast.error("İndirilecek tutanak bulunamadı"); return; }
    toast.info(`${targets.length} tutanak oluşturuluyor...`);
    for (const student of targets) {
      try {
        setGenerating(student.student_name);
        await generateDocx(student, caseNotes[student.student_name] || []);
        await new Promise((r) => setTimeout(r, 300));
      } catch (error) { console.error(`Error for ${student.student_name}:`, error); }
    }
    setGenerating(null);
    toast.success(`${targets.length} tutanak başarıyla oluşturuldu`);
  };

  // Önizleme
  const handlePreview = (student: StudentTutanak) => {
    setPreviewHtml(null);
    setPreviewStudent(student);
    setActiveTab("onizleme");
  };

  // Manuel form: neden toggle
  const toggleReason = (reason: string) => {
    setForm((prev) => ({
      ...prev,
      selectedReasons: prev.selectedReasons.includes(reason)
        ? prev.selectedReasons.filter((r) => r !== reason)
        : [...prev.selectedReasons, reason],
    }));
  };

  // Manuel form: özel neden ekle
  const addCustomReason = () => {
    if (!customReasonInput.trim()) return;
    setForm((prev) => ({
      ...prev,
      customReasons: [...prev.customReasons, customReasonInput.trim()],
    }));
    setCustomReasonInput("");
  };

  // Manuel form: ekstra tespit ekle
  const addExtraTespit = () => {
    if (!extraTespitInput.trim()) return;
    setForm((prev) => ({
      ...prev,
      extraTespitler: [...prev.extraTespitler, extraTespitInput.trim()],
    }));
    setExtraTespitInput("");
  };

  // Manuel tutanak oluştur ve indir
  const handleManualGenerate = async () => {
    if (!form.studentName.trim()) { toast.error("Öğrenci adı gerekli"); return; }
    const allReasons = [...form.selectedReasons, ...form.customReasons];
    if (allReasons.length === 0) { toast.error("En az bir neden seçin"); return; }

    const tutanakDate = form.tutanakDate
      ? new Date(form.tutanakDate).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" })
      : undefined;

    const student: StudentTutanak = {
      student_name: form.studentName,
      class_display: form.classDisplay || form.classKey || "[Sınıf]",
      class_key: form.classKey,
      teacher_name: form.teacherName || "[Sınıf Öğretmeni]",
      reasons: allReasons,
      notes: [form.notes, ...form.extraTespitler].filter(Boolean),
      referral_count: 1,
      first_referral: new Date().toISOString(),
      last_referral: new Date().toISOString(),
      uyruk: form.uyruk,
      manual: true,
    };

    try {
      setGenerating(form.studentName);
      await generateDocx(student, [], tutanakDate);
      const contentHtml = generateTutanakHtml(student, []);
      saveToHistory({
        student_name: student.student_name,
        class_display: student.class_display,
        teacher_name: student.teacher_name,
        reasons: student.reasons,
        date: new Date().toISOString(),
        type: "manual",
        content_html: contentHtml,
        template_id: selectedTemplate?.id,
      });
      toast.success(`${form.studentName} tutanağı oluşturuldu`);
    } catch (error) {
      console.error("Manual DOCX error:", error);
      toast.error("Tutanak oluşturulurken hata oluştu");
    } finally {
      setGenerating(null);
    }
  };

  // Manuel form: önizleme
  const handleManualPreview = () => {
    const allReasons = [...form.selectedReasons, ...form.customReasons];
    if (!form.studentName.trim() || allReasons.length === 0) {
      toast.error("Önizleme için öğrenci adı ve en az bir neden gerekli");
      return;
    }
    const student: StudentTutanak = {
      student_name: form.studentName,
      class_display: form.classDisplay || form.classKey || "[Sınıf]",
      class_key: form.classKey,
      teacher_name: form.teacherName || "[Sınıf Öğretmeni]",
      reasons: allReasons,
      notes: [form.notes, ...form.extraTespitler].filter(Boolean),
      referral_count: 1,
      first_referral: new Date().toISOString(),
      last_referral: new Date().toISOString(),
      uyruk: form.uyruk,
      manual: true,
    };
    setPreviewStudent(student);
    setActiveTab("onizleme");
  };

  // Form reset
  const resetForm = () => {
    setForm(initialForm);
    setFormStep(1);
    setCustomReasonInput("");
    setExtraTespitInput("");
    setClassStudents([]);
  };

  // Şablon seç ve formu doldur
  const applyTemplate = (template: TutanakTemplate) => {
    setSelectedTemplate(template);
    setForm({
      ...initialForm,
      selectedReasons: [...template.defaultReasons],
      uyruk: template.defaultUyruk,
      extraTespitler: template.tespitPrefix ? [] : [],
    });
    setFormStep(1);
    setActiveTab("manuel");
    toast.success(`"${template.label}" şablonu seçildi`);
  };

  // İstatistik hesaplamaları
  const chartData = useMemo(() => {
    // Neden dağılımı
    const reasonCounts: Record<string, number> = {};
    for (const s of students) {
      for (const r of s.reasons) {
        reasonCounts[r] = (reasonCounts[r] || 0) + 1;
      }
    }
    const reasonChart = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name: name.length > 22 ? name.slice(0, 22) + "…" : name, fullName: name, count }));

    // Sınıf dağılımı
    const classCounts: Record<string, number> = {};
    for (const s of students) {
      const cls = s.class_display || "Belirtilmemiş";
      classCounts[cls] = (classCounts[cls] || 0) + 1;
    }
    const classChart = Object.entries(classCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    // Aylık dağılım (history + referral verileri)
    const monthCounts: Record<string, number> = {};
    for (const s of students) {
      const d = new Date(s.last_referral);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthCounts[key] = (monthCounts[key] || 0) + 1;
    }
    for (const h of history) {
      const d = new Date(h.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthCounts[key] = (monthCounts[key] || 0) + 1;
    }
    const monthChart = Object.entries(monthCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => {
        const [y, m] = month.split("-");
        const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
        return { name: `${monthNames[parseInt(m) - 1]} ${y}`, count };
      });

    // Risk dağılımı
    const riskCounts = { Yüksek: 0, Orta: 0, Düşük: 0 };
    for (const s of students) {
      const severity = getSeverityLevel(s.reasons);
      riskCounts[severity.level as keyof typeof riskCounts]++;
    }
    const riskChart = Object.entries(riskCounts).map(([name, value]) => ({ name, value }));

    return { reasonChart, classChart, monthChart, riskChart };
  }, [students, history]);

  // Zaman çizelgesi verileri
  const timelineData = useMemo(() => {
    if (!timelineStudent) return [];
    const events: Array<{
      date: string;
      type: "referral" | "tutanak" | "case_note" | "parent_contact";
      title: string;
      detail: string;
      color: string;
      icon: string;
    }> = [];

    // Referral'dan gelen öğrenci verisi
    const student = students.find((s) => s.student_name === timelineStudent);
    if (student) {
      events.push({
        date: student.first_referral,
        type: "referral",
        title: "İlk Yönlendirme",
        detail: `Nedenler: ${student.reasons.join(", ")}. Öğretmen: ${student.teacher_name}`,
        color: "teal",
        icon: "referral",
      });
      if (student.first_referral !== student.last_referral) {
        events.push({
          date: student.last_referral,
          type: "referral",
          title: `Son Yönlendirme (${student.referral_count}. kez)`,
          detail: `Nedenler: ${student.reasons.join(", ")}`,
          color: "blue",
          icon: "referral",
        });
      }
    }

    // Vaka notları
    const notes = caseNotes[timelineStudent] || [];
    for (const n of notes) {
      const typeLabel = n.note_type === "gozlem" ? "Gözlem Notu" : n.note_type === "gorusme" ? "Görüşme Notu" : n.note_type === "degerlendirme" ? "Değerlendirme" : "Plan";
      events.push({
        date: n.note_date,
        type: "case_note",
        title: typeLabel,
        detail: n.content.length > 120 ? n.content.slice(0, 120) + "…" : n.content,
        color: "purple",
        icon: "note",
      });
    }

    // Tutanak geçmişi
    for (const h of history) {
      if (h.student_name === timelineStudent) {
        events.push({
          date: h.date,
          type: "tutanak",
          title: `Tutanak Oluşturuldu (${h.type === "manual" ? "Manuel" : "Otomatik"})`,
          detail: `Nedenler: ${h.reasons.join(", ")}`,
          color: h.type === "manual" ? "amber" : "emerald",
          icon: "tutanak",
        });
      }
    }

    // Veli iletişim sayısı (tarih yok, genel bilgi)
    const contacts = parentContacts[timelineStudent] || 0;
    if (contacts > 0) {
      events.push({
        date: new Date().toISOString(),
        type: "parent_contact",
        title: `Veli İletişim (${contacts} kayıt)`,
        detail: "Veli ile iletişim kurulmuş",
        color: "pink",
        icon: "phone",
      });
    }

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [timelineStudent, students, caseNotes, history, parentContacts]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-teal-200 animate-ping opacity-20" />
            <div className="absolute inset-0 rounded-full border-4 border-teal-400/30 animate-spin border-t-teal-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <ClipboardCheck className="h-6 w-6 text-teal-500" />
            </div>
          </div>
          <p className="text-slate-500 text-sm">Akademik tutanak verileri yükleniyor...</p>
        </motion.div>
      </div>
    );
  }

  // Tüm nedenler (form + seçili)
  const allFormReasons = [...form.selectedReasons, ...form.customReasons];
  const formSeverity = allFormReasons.length > 0 ? getSeverityLevel(allFormReasons) : null;

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6 pb-8">
      {/* Başlık */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-700 p-6 text-white shadow-xl">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <ClipboardCheck className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Akademik Durum Tespit Tutanağı</h1>
              <p className="text-teal-100 text-sm mt-1">Otomatik veya manuel tutanak oluşturma</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={fetchData} variant="ghost" className="bg-white/10 hover:bg-white/20 text-white border-0">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Yenile
            </Button>
            <Button onClick={handleBulkDownload} disabled={!!generating} className="bg-white text-teal-700 hover:bg-teal-50 font-semibold shadow-lg">
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Tümünü İndir ({filteredStudents.length})
            </Button>
          </div>
        </div>
      </motion.div>

      {/* İstatistik Kartları */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Toplam Öğrenci", value: stats.totalStudents, icon: Users, color: "teal", gradient: "from-teal-500 to-emerald-600" },
          { label: "Yönlendirme Nedeni", value: stats.totalReasons, icon: Activity, color: "blue", gradient: "from-blue-500 to-indigo-600" },
          { label: "Devamsızlık", value: stats.devamsizlik, icon: Calendar, color: "red", gradient: "from-red-500 to-rose-600" },
          { label: "Rehberlik İhtiyacı", value: stats.rehberlik, icon: BookOpen, color: "purple", gradient: "from-purple-500 to-violet-600" },
        ].map((stat) => (
          <motion.div key={stat.label} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} className="relative overflow-hidden rounded-xl bg-white border border-slate-200 p-4 shadow-sm cursor-default">
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-bl-[40px]`} />
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                <stat.icon className={`h-5 w-5 text-${stat.color}-600`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col gap-4">
            {/* Custom Tab Navigation */}
            <div className="relative bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-2 shadow-sm overflow-x-auto">
              <TabsList className="bg-transparent p-0 h-auto flex gap-1.5 w-max min-w-full">
                {([
                  { value: "liste", label: "Otomatik", icon: Users, color: "teal", activeGradient: "from-teal-500 to-emerald-600", badge: undefined as string | undefined },
                  { value: "manuel", label: "Manuel Oluştur", icon: PenLine, color: "violet", activeGradient: "from-violet-500 to-purple-600", badge: undefined as string | undefined },
                  { value: "onizleme", label: "Önizleme", icon: Eye, color: "blue", activeGradient: "from-blue-500 to-indigo-600", badge: undefined as string | undefined },
                  { value: "sablonlar", label: "Şablonlar", icon: Layout, color: "amber", activeGradient: "from-amber-500 to-orange-600", badge: undefined as string | undefined },
                  { value: "istatistik", label: "İstatistikler", icon: BarChart3, color: "cyan", activeGradient: "from-cyan-500 to-blue-600", badge: undefined as string | undefined },
                  { value: "zaman-cizelgesi", label: "Zaman Çizelgesi", icon: GitBranch, color: "emerald", activeGradient: "from-emerald-500 to-teal-600", badge: undefined as string | undefined },
                  { value: "editor", label: "Düzenle", icon: Edit3, color: "indigo", activeGradient: "from-indigo-500 to-violet-600", badge: undefined as string | undefined },
                  { value: "gecmis", label: "Geçmiş", icon: History, color: "rose", activeGradient: "from-rose-500 to-pink-600", badge: history.length > 0 ? String(history.length) : undefined },
                ]).map((tab) => {
                  const isActive = activeTab === tab.value;
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className={`
                        relative group rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-300 ease-out
                        flex items-center gap-2 whitespace-nowrap
                        ${isActive
                          ? `bg-gradient-to-r ${tab.activeGradient} text-white shadow-lg scale-[1.02]`
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                        }
                        data-[state=active]:text-white data-[state=active]:shadow-lg
                      `}
                    >
                      {/* Active glow effect */}
                      {isActive && (
                        <motion.div
                          layoutId="activeTabGlow"
                          className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tab.activeGradient} opacity-100`}
                          transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
                          style={{ zIndex: -1 }}
                        />
                      )}
                      <Icon className={`h-4 w-4 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                      <span className="hidden sm:inline">{tab.label}</span>
                      {tab.badge && (
                        <span className={`
                          min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1
                          ${isActive ? "bg-white/25 text-white" : "bg-rose-100 text-rose-700"}
                        `}>
                          {tab.badge}
                        </span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {activeTab === "liste" && (
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Öğrenci, sınıf, neden ara..." className="pl-10 bg-white border-slate-200 rounded-xl" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ==================== OTOMATİK LİSTE TAB ==================== */}
          <TabsContent value="liste" className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredStudents.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                  <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <GraduationCap className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 font-medium">{searchQuery ? "Arama sonucu bulunamadı" : "Henüz tutanak verisi yok"}</p>
                  <p className="text-slate-400 text-sm mt-1">{searchQuery ? "Farklı bir arama terimi deneyin" : "RPD verilerinden beslenir veya Manuel sekmesinden oluşturabilirsiniz"}</p>
                  <Button className="mt-4 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => setActiveTab("manuel")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Manuel Tutanak Oluştur
                  </Button>
                </motion.div>
              ) : (
                filteredStudents.map((student, index) => {
                  const isExpanded = expandedCards.has(student.student_name);
                  const notes = caseNotes[student.student_name] || [];
                  const contacts = parentContacts[student.student_name] || 0;
                  const severity = getSeverityLevel(student.reasons);

                  return (
                    <motion.div key={student.student_name} layout variants={itemVariants} initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.05 }}>
                      <motion.div initial="rest" whileHover="hover" variants={cardHover} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="p-4 cursor-pointer flex items-center gap-4" onClick={() => toggleCard(student.student_name)}>
                          {/* Avatar + Severity */}
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                              {student.student_name.charAt(0)}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${severity.bg} border-2 border-white`} title={`Risk: ${severity.level}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-slate-800 text-base">{student.student_name}</h3>
                              <Badge variant="outline" className="text-xs bg-slate-50">{student.class_display || "Sınıf belirtilmedi"}</Badge>
                              <Badge className={`text-xs ${severity.color} bg-opacity-10 border`}>{severity.level} Risk</Badge>
                              {student.referral_count > 1 && (
                                <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">{student.referral_count}x yönlendirme</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                              <span className="flex items-center gap-1"><User className="h-3 w-3" />{student.teacher_name}</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(student.last_referral)}</span>
                              {contacts > 0 && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{contacts} veli görüşme</span>}
                            </div>
                          </div>

                          <div className="hidden lg:flex items-center gap-2 flex-wrap max-w-sm">
                            {student.reasons.slice(0, 3).map((reason) => (
                              <Badge key={reason} variant="outline" className={`text-xs ${getReasonColor(reason)} flex items-center gap-1`}>
                                {getReasonIcon(reason)}
                                {reason.length > 25 ? reason.slice(0, 25) + "..." : reason}
                              </Badge>
                            ))}
                            {student.reasons.length > 3 && <Badge variant="outline" className="text-xs bg-slate-50">+{student.reasons.length - 3}</Badge>}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" className="text-teal-600 hover:bg-teal-50" onClick={(e) => { e.stopPropagation(); handlePreview(student); }}><Eye className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" className="text-emerald-600 hover:bg-emerald-50" disabled={generating === student.student_name} onClick={(e) => { e.stopPropagation(); handleDownload(student); }}>
                              {generating === student.student_name ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                            </Button>
                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                            </motion.div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
                              <div className="px-4 pb-4 pt-0 border-t border-slate-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" />Yönlendirme Nedenleri</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {student.reasons.map((reason) => (
                                        <Badge key={reason} variant="outline" className={`text-xs ${getReasonColor(reason)} flex items-center gap-1`}>{getReasonIcon(reason)}{reason}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><FileText className="h-4 w-4 text-teal-500" />Tutanak Detayları</h4>
                                    <div className="text-sm text-slate-600 space-y-1">
                                      <p><span className="font-medium">İlk Yönlendirme:</span> {formatDateLong(student.first_referral)}</p>
                                      <p><span className="font-medium">Son Yönlendirme:</span> {formatDateLong(student.last_referral)}</p>
                                      <p><span className="font-medium">Toplam Yönlendirme:</span> {student.referral_count} kez</p>
                                    </div>
                                  </div>
                                  {(student.notes.length > 0 || notes.length > 0) && (
                                    <div className="md:col-span-2 space-y-2">
                                      <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><MessageCircle className="h-4 w-4 text-blue-500" />Notlar ve Gözlemler</h4>
                                      <div className="space-y-2">
                                        {student.notes.map((note, i) => (<div key={i} className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100">{note}</div>))}
                                        {notes.map((cn, i) => (
                                          <div key={`cn-${i}`} className="text-sm text-slate-600 bg-blue-50 rounded-lg p-3 border border-blue-100">
                                            <Badge className="bg-blue-100 text-blue-700 text-xs mb-1">{cn.note_type === "gozlem" ? "Gözlem" : cn.note_type === "gorusme" ? "Görüşme" : cn.note_type === "degerlendirme" ? "Değerlendirme" : "Plan"}</Badge>
                                            <p className="mt-1">{cn.content}</p>
                                            <p className="text-xs text-blue-400 mt-1">{formatDate(cn.note_date)}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100">
                                  <Button size="sm" className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700" disabled={generating === student.student_name} onClick={() => handleDownload(student)}>
                                    {generating === student.student_name ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}DOCX İndir
                                  </Button>
                                  <Button size="sm" variant="outline" className="border-teal-200 text-teal-700 hover:bg-teal-50" onClick={() => handlePreview(student)}><Eye className="h-4 w-4 mr-2" />Önizle</Button>
                                  <Button size="sm" variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50" onClick={() => {
                                    const html = generateTutanakHtml(student, caseNotes[student.student_name] || []);
                                    setEditorContent(html);
                                    setEditorOriginalContent(html);
                                    setEditorStudentName(student.student_name);
                                    setActiveTab("editor");
                                  }}><Edit3 className="h-4 w-4 mr-2" />Düzenle</Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </TabsContent>

          {/* ==================== MANUEL OLUŞTUR TAB ==================== */}
          <TabsContent value="manuel">
            <motion.div variants={slideIn} initial="hidden" animate="visible" className="space-y-6">
              {/* Seçili şablon göstergesi */}
              {selectedTemplate && selectedTemplate.id !== "bos" && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r ${selectedTemplate.gradient} bg-opacity-10 border mb-2`}>
                  <selectedTemplate.icon className="h-5 w-5 text-white opacity-80" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-white">{selectedTemplate.label}</span>
                    <span className="text-xs text-white/70 ml-2">— {selectedTemplate.defaultReasons.length} neden otomatik seçildi</span>
                  </div>
                  <button onClick={() => { setSelectedTemplate(null); resetForm(); }} className="text-white/70 hover:text-white"><X className="h-4 w-4" /></button>
                </motion.div>
              )}

              {/* Adım göstergesi */}
              <div className="flex items-center gap-2 mb-2">
                {[1, 2, 3].map((step) => (
                  <button key={step} onClick={() => setFormStep(step)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${formStep === step ? "bg-teal-600 text-white shadow-md" : formStep > step ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-500"}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${formStep === step ? "bg-white/20" : formStep > step ? "bg-teal-500 text-white" : "bg-slate-300 text-white"}`}>
                      {formStep > step ? <Check className="h-3 w-3" /> : step}
                    </span>
                    {step === 1 ? "Öğrenci Bilgileri" : step === 2 ? "Nedenler" : "Ek Bilgiler"}
                  </button>
                ))}
              </div>

              {/* Adım 1: Öğrenci Bilgileri */}
              <AnimatePresence mode="wait">
                {formStep === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <Card className="border-slate-200">
                      <CardContent className="p-6 space-y-5">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-5 w-5 text-teal-600" />
                          <h3 className="font-semibold text-slate-800">Öğrenci Bilgileri</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Sınıf seçimi */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Sınıf / Şube</Label>
                            <Select value={form.classKey} onValueChange={(val) => {
                              const cls = classes.find((c) => c.value === val);
                              // Sınıfa bağlı öğretmeni otomatik bul
                              const matchedTeacher = teachers.find((t) => t.sinifSubeKey === val);
                              setForm((prev) => ({
                                ...prev,
                                classKey: val,
                                classDisplay: cls?.text || val,
                                teacherName: matchedTeacher?.label || prev.teacherName,
                                studentName: "", // Sınıf değişince öğrenci sıfırla
                              }));
                              loadStudents(val);
                            }}>
                              <SelectTrigger className="bg-white"><SelectValue placeholder="Sınıf seçin..." /></SelectTrigger>
                              <SelectContent>
                                {classes.map((c) => {
                                  const t = teachers.find((t) => t.sinifSubeKey === c.value);
                                  return (
                                    <SelectItem key={c.value} value={c.value}>
                                      {c.text}{t ? ` — ${t.label}` : ""}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            {form.classKey && form.teacherName && (
                              <p className="text-xs text-emerald-600 flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                Öğretmen otomatik eşleştirildi: <strong>{form.teacherName}</strong>
                              </p>
                            )}
                          </div>

                          {/* Öğrenci seçimi / yazımı */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">
                              Öğrenci Adı Soyadı
                              {loadingStudents && <Loader2 className="inline h-3 w-3 ml-2 animate-spin text-teal-500" />}
                            </Label>
                            {classStudents.length > 0 ? (
                              <>
                                <Select value={form.studentName} onValueChange={(val) => {
                                  setForm((prev) => ({ ...prev, studentName: val }));
                                }}>
                                  <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Öğrenci seçin..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {classStudents.map((s) => (<SelectItem key={s.value} value={s.text}>{s.text}</SelectItem>))}
                                  </SelectContent>
                                </Select>
                                <button onClick={() => setClassStudents([])} className="text-xs text-teal-600 hover:underline">Manuel yazarak girmek istiyorum</button>
                              </>
                            ) : (
                              <>
                                <Input value={form.studentName} onChange={(e) => setForm((prev) => ({ ...prev, studentName: e.target.value }))} placeholder={form.classKey ? "Öğrenci adı soyadı yazın..." : "Önce sınıf seçin veya doğrudan yazın..."} className="bg-white" />
                                {form.classKey && !loadingStudents && (
                                  <button onClick={() => loadStudents(form.classKey)} className="text-xs text-teal-600 hover:underline">Sınıf listesinden seçmek istiyorum</button>
                                )}
                              </>
                            )}
                          </div>

                          {/* Öğretmen */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Sınıf Öğretmeni</Label>
                            {teachers.length > 0 ? (
                              <Select value={form.teacherName} onValueChange={(val) => {
                                const matchedTeacher = teachers.find((t) => t.label === val);
                                // Öğretmen seçilince sınıfı otomatik bul
                                if (matchedTeacher?.sinifSubeKey && !form.classKey) {
                                  const cls = classes.find((c) => c.value === matchedTeacher.sinifSubeKey);
                                  setForm((prev) => ({
                                    ...prev,
                                    teacherName: val,
                                    classKey: matchedTeacher.sinifSubeKey || prev.classKey,
                                    classDisplay: cls?.text || matchedTeacher.sinifSubeDisplay || prev.classDisplay,
                                    studentName: "",
                                  }));
                                  if (matchedTeacher.sinifSubeKey) loadStudents(matchedTeacher.sinifSubeKey);
                                } else {
                                  setForm((prev) => ({ ...prev, teacherName: val }));
                                }
                              }}>
                                <SelectTrigger className="bg-white"><SelectValue placeholder="Öğretmen seçin..." /></SelectTrigger>
                                <SelectContent>
                                  {teachers.map((t) => (
                                    <SelectItem key={t.value} value={t.label}>
                                      {t.label}{t.sinifSubeDisplay ? ` (${t.sinifSubeDisplay})` : ""}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input value={form.teacherName} onChange={(e) => setForm((prev) => ({ ...prev, teacherName: e.target.value }))} placeholder="Öğretmen adı yazın..." className="bg-white" />
                            )}
                            {form.teacherName && form.classKey && (() => {
                              const t = teachers.find((t) => t.label === form.teacherName);
                              if (t?.sinifSubeKey && t.sinifSubeKey !== form.classKey) {
                                return (
                                  <p className="text-xs text-amber-600 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Bu öğretmen normalde {t.sinifSubeDisplay} sınıfına atanmış
                                  </p>
                                );
                              }
                              return null;
                            })()}
                          </div>

                          {/* Uyruk */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Uyruk / Milliyet</Label>
                            <Select value={form.uyruk} onValueChange={(val) => setForm((prev) => ({ ...prev, uyruk: val }))}>
                              <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {UYRUK_OPTIONS.map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Tarih */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Tutanak Tarihi</Label>
                            <Input type="date" value={form.tutanakDate} onChange={(e) => setForm((prev) => ({ ...prev, tutanakDate: e.target.value }))} className="bg-white" />
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => {
                            if (!form.studentName.trim()) { toast.error("Öğrenci adı gerekli"); return; }
                            setFormStep(2);
                          }}>
                            İleri <ChevronDown className="h-4 w-4 ml-1 -rotate-90" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Adım 2: Nedenler */}
                {formStep === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <Card className="border-slate-200">
                      <CardContent className="p-6 space-y-5">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                          <h3 className="font-semibold text-slate-800">Yönlendirme Nedenleri</h3>
                          {formSeverity && (
                            <Badge className={`${formSeverity.color} bg-opacity-10 border ml-auto`}>
                              {formSeverity.level} Risk - {allFormReasons.length} neden
                            </Badge>
                          )}
                        </div>

                        {/* Hazır nedenler grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {TUTANAK_NEDENLERI.map((reason) => {
                            const isSelected = form.selectedReasons.includes(reason);
                            return (
                              <motion.button
                                key={reason}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => toggleReason(reason)}
                                className={`flex items-center gap-2 p-3 rounded-lg border text-sm text-left transition-all ${
                                  isSelected
                                    ? `${getReasonColor(reason)} border-current shadow-sm`
                                    : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                              >
                                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? "bg-current/20" : "border border-slate-300"}`}>
                                  {isSelected && <Check className="h-3 w-3" />}
                                </div>
                                <span className="flex-1">{reason}</span>
                              </motion.button>
                            );
                          })}
                        </div>

                        {/* Özel neden ekleme */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <Label className="text-sm font-medium text-slate-700">Özel Neden Ekle</Label>
                          <div className="flex gap-2">
                            <Input value={customReasonInput} onChange={(e) => setCustomReasonInput(e.target.value)} placeholder="Özel bir neden yazın..." className="bg-white flex-1" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomReason(); } }} />
                            <Button onClick={addCustomReason} size="sm" variant="outline" className="border-teal-200 text-teal-700"><Plus className="h-4 w-4" /></Button>
                          </div>
                          {form.customReasons.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {form.customReasons.map((r, i) => (
                                <Badge key={i} variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 flex items-center gap-1">
                                  {r}
                                  <button onClick={() => setForm((prev) => ({ ...prev, customReasons: prev.customReasons.filter((_, idx) => idx !== i) }))} className="ml-1 hover:text-red-500">
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between pt-2">
                          <Button variant="outline" onClick={() => setFormStep(1)}><ChevronDown className="h-4 w-4 mr-1 rotate-90" />Geri</Button>
                          <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => {
                            if (allFormReasons.length === 0) { toast.error("En az bir neden seçin"); return; }
                            setFormStep(3);
                          }}>
                            İleri <ChevronDown className="h-4 w-4 ml-1 -rotate-90" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Adım 3: Ek Bilgiler + Oluştur */}
                {formStep === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <Card className="border-slate-200">
                      <CardContent className="p-6 space-y-5">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-5 w-5 text-purple-500" />
                          <h3 className="font-semibold text-slate-800">Ek Bilgiler ve Tespitler</h3>
                        </div>

                        {/* Genel not */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Genel Not / Açıklama</Label>
                          <textarea
                            value={form.notes}
                            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                            placeholder="Öğrenci hakkında ek bilgi veya gözlemlerinizi yazın..."
                            className="w-full min-h-[100px] p-3 rounded-lg border border-slate-200 bg-white text-sm resize-y focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400"
                          />
                        </div>

                        {/* Ekstra tespit ekleme */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <Label className="text-sm font-medium text-slate-700">Ek Tespit Maddesi Ekle</Label>
                          <p className="text-xs text-slate-400">Bu maddeler tutanağın II. bölümüne doğrudan eklenecektir.</p>
                          <div className="flex gap-2">
                            <Input value={extraTespitInput} onChange={(e) => setExtraTespitInput(e.target.value)} placeholder="Tespit maddesi yazın..." className="bg-white flex-1" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExtraTespit(); } }} />
                            <Button onClick={addExtraTespit} size="sm" variant="outline" className="border-purple-200 text-purple-700"><Plus className="h-4 w-4" /></Button>
                          </div>
                          {form.extraTespitler.length > 0 && (
                            <div className="space-y-2 mt-2">
                              {form.extraTespitler.map((t, i) => (
                                <div key={i} className="flex items-start gap-2 bg-purple-50 rounded-lg p-3 border border-purple-100 text-sm">
                                  <Hash className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                  <span className="flex-1 text-slate-700">{t}</span>
                                  <button onClick={() => setForm((prev) => ({ ...prev, extraTespitler: prev.extraTespitler.filter((_, idx) => idx !== i) }))} className="text-slate-400 hover:text-red-500">
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Özet kartı */}
                        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-4 border border-teal-100 space-y-2">
                          <h4 className="font-semibold text-teal-800 text-sm flex items-center gap-2"><FileText className="h-4 w-4" />Tutanak Özeti</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <p><span className="font-medium text-teal-700">Öğrenci:</span> {form.studentName || "—"}</p>
                            <p><span className="font-medium text-teal-700">Sınıf:</span> {form.classDisplay || form.classKey || "—"}</p>
                            <p><span className="font-medium text-teal-700">Öğretmen:</span> {form.teacherName || "—"}</p>
                            <p><span className="font-medium text-teal-700">Uyruk:</span> {form.uyruk}</p>
                            <p><span className="font-medium text-teal-700">Tarih:</span> {form.tutanakDate ? new Date(form.tutanakDate).toLocaleDateString("tr-TR") : "—"}</p>
                            <p><span className="font-medium text-teal-700">Neden Sayısı:</span> {allFormReasons.length}</p>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {allFormReasons.map((r) => (<Badge key={r} variant="outline" className={`text-xs ${getReasonColor(r)}`}>{r}</Badge>))}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          <Button variant="outline" onClick={() => setFormStep(2)}><ChevronDown className="h-4 w-4 mr-1 rotate-90" />Geri</Button>
                          <Button variant="outline" className="border-slate-200" onClick={resetForm}><Trash2 className="h-4 w-4 mr-2" />Sıfırla</Button>
                          <div className="flex-1" />
                          <Button variant="outline" className="border-teal-200 text-teal-700 hover:bg-teal-50" onClick={handleManualPreview}><Eye className="h-4 w-4 mr-2" />Önizle</Button>
                          <Button className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700 shadow-lg font-semibold" disabled={!!generating} onClick={handleManualGenerate}>
                            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                            Tutanak Oluştur ve İndir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </TabsContent>

          {/* ==================== ÖNİZLEME TAB ==================== */}
          <TabsContent value="onizleme">
            {/* Editörden gelen HTML önizleme */}
            {previewHtml ? (
              <motion.div variants={slideIn} initial="hidden" animate="visible">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Button size="sm" variant="ghost" onClick={() => { setPreviewHtml(null); setActiveTab("editor"); }} className="text-slate-500">
                      <X className="h-4 w-4 mr-1" />Kapat
                    </Button>
                    <span className="text-sm text-slate-500">|</span>
                    <h3 className="font-semibold text-slate-700">{editorStudentName || "Tutanak"} — Düzenlenmiş Önizleme</h3>
                    <Badge className="bg-indigo-100 text-indigo-700 text-xs">Editörden</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="border-indigo-200 text-indigo-700" onClick={() => { setPreviewHtml(null); setActiveTab("editor"); }}>
                      <Edit3 className="h-4 w-4 mr-2" />Düzenlemeye Dön
                    </Button>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white"
                      disabled={!!generating}
                      onClick={async () => {
                        try {
                          setGenerating(editorStudentName || "editor");
                          const today = new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
                          const fileName = `Tutanak_${(editorStudentName || "Belge").replace(/\s+/g, "_")}_${today.replace(/\./g, "-")}.docx`;
                          await htmlToDocx(editorContent, fileName);
                          toast.success("Düzenlenmiş tutanak indirildi");
                        } catch (error) {
                          console.error("Preview DOCX error:", error);
                          toast.error("DOCX oluşturulurken hata oluştu");
                        } finally {
                          setGenerating(null);
                        }
                      }}
                    >
                      {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}DOCX İndir
                    </Button>
                  </div>
                </div>
                <Card className="bg-white shadow-xl border-0 max-w-3xl mx-auto">
                  <CardContent className="p-8 md:p-12">
                    <div
                      className="prose prose-sm max-w-none"
                      style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "12pt", lineHeight: 1.8 }}
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            ) : !previewStudent ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                <div className="mx-auto w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4"><Eye className="h-8 w-8 text-teal-400" /></div>
                <p className="text-slate-500 font-medium">Önizleme için bir öğrenci seçin</p>
                <p className="text-slate-400 text-sm mt-1">Listeden göz simgesine tıklayın veya manuel formdan önizleyin</p>
              </motion.div>
            ) : (
              <motion.div key={previewStudent.student_name} variants={slideIn} initial="hidden" animate="visible">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Button size="sm" variant="ghost" onClick={() => { setPreviewStudent(null); setActiveTab(previewStudent.manual ? "manuel" : "liste"); }} className="text-slate-500">
                      <X className="h-4 w-4 mr-1" />Kapat
                    </Button>
                    <span className="text-sm text-slate-500">|</span>
                    <h3 className="font-semibold text-slate-700">{previewStudent.student_name} - Tutanak Önizleme</h3>
                    {previewStudent.manual && <Badge className="bg-purple-100 text-purple-700 text-xs">Manuel</Badge>}
                  </div>
                  <Button size="sm" className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white" disabled={generating === previewStudent.student_name} onClick={() => handleDownload(previewStudent)}>
                    {generating === previewStudent.student_name ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}DOCX İndir
                  </Button>
                </div>

                <Card className="bg-white shadow-xl border-0 max-w-3xl mx-auto">
                  <CardContent className="p-8 md:p-12 space-y-6">
                    <div className="text-center space-y-1">
                      <p className="font-bold text-sm">T.C.</p>
                      <p className="font-bold text-sm">{ILCE.toUpperCase()}</p>
                      <p className="font-bold text-sm">{OKUL_MUDURLUBU}</p>
                      <p className="font-bold text-sm">REHBERLİK SERVİSİ</p>
                      <p className="font-bold text-base underline mt-3">AKADEMİK DURUM TESPİT TUTANAĞI</p>
                    </div>

                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      {[
                        ["Öğrencinin Adı Soyadı", previewStudent.student_name],
                        ...(previewStudent.uyruk && previewStudent.uyruk !== "T.C." ? [["Uyruk / Milliyet", previewStudent.uyruk]] : []),
                        ["Okul / Sınıf", `${OKUL_ADI} / ${previewStudent.class_display}`],
                        ["Sınıf Öğretmeni", previewStudent.teacher_name],
                        ["Tutanak Tarihi", new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" })],
                        ["Düzenleyen Birim", "Rehberlik Servisi"],
                        ["Yönlendirme Nedeni", previewStudent.reasons.join(", ")],
                      ].map(([label, value], i, arr) => (
                        <div key={label} className={`grid grid-cols-3 text-sm ${i < arr.length - 1 ? "border-b border-slate-200" : ""}`}>
                          <div className="font-semibold bg-slate-50 p-2 border-r border-slate-200">{label}</div>
                          <div className="col-span-2 p-2">{value}</div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <h3 className="font-bold text-sm mb-2">I. TUTANAĞI DÜZENLEYEN KİŞİLER</h3>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        Bu tutanak; {OKUL_ADI} Rehberlik Servisi Psikolojik Danışmanı <strong>{REHBER_OGRETMEN}</strong>, sınıf öğretmeni <strong>{previewStudent.teacher_name}</strong> ve müdür yardımcısı <strong>{MUDUR_YARDIMCISI}</strong> tarafından ortaklaşa düzenlenmiştir.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm mb-2">II. TESPİT EDİLEN HUSUSLAR</h3>
                      <ol className="space-y-2 text-sm text-slate-700 leading-relaxed list-decimal list-inside">
                        {generateTespitler(previewStudent, caseNotes[previewStudent.student_name] || []).map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ol>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm mb-2">III. ORTAK KANAAT VE SONUÇ</h3>
                      <p className="text-sm text-slate-700 leading-relaxed">{generateKanaat(previewStudent)}</p>
                    </div>

                    <div className="grid grid-cols-4 gap-4 pt-8 text-center text-xs">
                      {[
                        ["Rehber Öğretmen", REHBER_OGRETMEN],
                        ["Sınıf Öğretmeni", previewStudent.teacher_name],
                        ["Müdür Yardımcısı", MUDUR_YARDIMCISI],
                        ["Öğrenci Velisi", "........................"],
                      ].map(([title, name]) => (
                        <div key={title} className="space-y-8"><p className="font-semibold">{title}</p><p>{name}</p></div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* ==================== GEÇMİŞ TAB ==================== */}
          {/* ==================== ŞABLONLAR TAB ==================== */}
          <TabsContent value="sablonlar">
            <motion.div variants={slideIn} initial="hidden" animate="visible" className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Layout className="h-5 w-5 text-teal-600" />
                <h3 className="font-semibold text-slate-800">Tutanak Şablonları</h3>
                <p className="text-sm text-slate-500 ml-2">— Şablon seçerek hızlıca tutanak oluşturun</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {TUTANAK_SABLONLARI.map((template) => (
                  <motion.div
                    key={template.id}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="cursor-pointer group"
                    onClick={() => applyTemplate(template)}
                  >
                    <Card className="border-slate-200 overflow-hidden h-full transition-shadow group-hover:shadow-lg">
                      <div className={`h-2 bg-gradient-to-r ${template.gradient}`} />
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-xl bg-${template.color}-100 flex-shrink-0`}>
                            <template.icon className={`h-6 w-6 text-${template.color}-600`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-800 text-sm">{template.label}</h4>
                            <p className="text-xs text-slate-500 mt-1">{template.description}</p>
                          </div>
                        </div>

                        {template.defaultReasons.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {template.defaultReasons.map((r) => (
                              <Badge key={r} variant="outline" className={`text-xs ${getReasonColor(r)}`}>
                                {r.length > 25 ? r.slice(0, 25) + "…" : r}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <span className="text-xs text-slate-400">
                            {template.defaultReasons.length > 0 ? `${template.defaultReasons.length} neden hazır` : "Boş şablon"}
                          </span>
                          <span className="text-xs text-teal-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                            Kullan <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Şablon bilgilendirme */}
              <Card className="border-teal-100 bg-teal-50/50">
                <CardContent className="p-4 flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-teal-800">
                    <p className="font-medium">Şablon nasıl çalışır?</p>
                    <p className="text-teal-600 mt-1">Bir şablon seçtiğinizde yönlendirme nedenleri ve uyruk bilgisi otomatik doldurulur. Manuel Oluştur sekmesine yönlendirilirsiniz ve bilgileri düzenleyebilirsiniz.</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ==================== İSTATİSTİKLER TAB ==================== */}
          <TabsContent value="istatistik">
            <motion.div variants={slideIn} initial="hidden" animate="visible" className="space-y-6">
              {students.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"><BarChart3 className="h-8 w-8 text-slate-400" /></div>
                  <p className="text-slate-500 font-medium">Henüz istatistik verisi yok</p>
                  <p className="text-slate-400 text-sm mt-1">Yönlendirme verileri geldikçe grafikler burada görünecek</p>
                </div>
              ) : (
                <>
                  {/* Üst özet kartları */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-slate-200"><CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-teal-600">{students.length}</p>
                      <p className="text-xs text-slate-500 mt-1">Toplam Öğrenci</p>
                    </CardContent></Card>
                    <Card className="border-slate-200"><CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-blue-600">{chartData.reasonChart.length}</p>
                      <p className="text-xs text-slate-500 mt-1">Farklı Neden</p>
                    </CardContent></Card>
                    <Card className="border-slate-200"><CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-amber-600">{history.length}</p>
                      <p className="text-xs text-slate-500 mt-1">Oluşturulan Tutanak</p>
                    </CardContent></Card>
                    <Card className="border-slate-200"><CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-red-600">{chartData.riskChart.find(r => r.name === "Yüksek")?.value || 0}</p>
                      <p className="text-xs text-slate-500 mt-1">Yüksek Riskli</p>
                    </CardContent></Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Neden Dağılımı — Bar Chart */}
                    <Card className="border-slate-200">
                      <CardContent className="p-5">
                        <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2 mb-4">
                          <Target className="h-4 w-4 text-teal-500" />
                          Yönlendirme Nedenleri Dağılımı
                        </h4>
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.reasonChart} layout="vertical" margin={{ left: 10, right: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis type="number" tick={{ fontSize: 12, fill: "#64748b" }} />
                              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: "#64748b" }} />
                              <RechartsTooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} formatter={(value) => [value, "Öğrenci"]} />
                              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                                {chartData.reasonChart.map((_entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Sınıf Dağılımı — Bar Chart */}
                    <Card className="border-slate-200">
                      <CardContent className="p-5">
                        <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2 mb-4">
                          <Users className="h-4 w-4 text-blue-500" />
                          Sınıf Bazlı Dağılım
                        </h4>
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.classChart} margin={{ left: 0, right: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                              <RechartsTooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                              <Bar dataKey="count" name="Öğrenci" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                                {chartData.classChart.map((_entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Risk Dağılımı — Pie Chart */}
                    <Card className="border-slate-200">
                      <CardContent className="p-5">
                        <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2 mb-4">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          Risk Seviyesi Dağılımı
                        </h4>
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={chartData.riskChart} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                <Cell fill="#ef4444" />
                                <Cell fill="#f59e0b" />
                                <Cell fill="#10b981" />
                              </Pie>
                              <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
                              <RechartsTooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Aylık Tutanak Trendi */}
                    <Card className="border-slate-200">
                      <CardContent className="p-5">
                        <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2 mb-4">
                          <Calendar className="h-4 w-4 text-indigo-500" />
                          Aylık Tutanak / Yönlendirme Trendi
                        </h4>
                        <div className="h-72">
                          {chartData.monthChart.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData.monthChart} margin={{ left: 0, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                                <RechartsTooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                                <Bar dataKey="count" name="Kayıt" fill="#6366f1" radius={[6, 6, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-sm">Aylık veri bulunamadı</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* En çok yönlendirilen öğrenciler tablosu */}
                  <Card className="border-slate-200">
                    <CardContent className="p-5">
                      <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2 mb-4">
                        <Zap className="h-4 w-4 text-amber-500" />
                        En Çok Yönlendirilen Öğrenciler
                      </h4>
                      <div className="space-y-2">
                        {students.filter(s => s.referral_count > 1).sort((a, b) => b.referral_count - a.referral_count).slice(0, 10).map((s, i) => {
                          const severity = getSeverityLevel(s.reasons);
                          return (
                            <div key={s.student_name} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                              <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-slate-800 text-sm">{s.student_name}</span>
                                <span className="text-xs text-slate-500 ml-2">{s.class_display}</span>
                              </div>
                              <Badge className={`text-xs ${severity.color} bg-opacity-10 border`}>{severity.level}</Badge>
                              <Badge className="bg-amber-100 text-amber-700 text-xs font-bold">{s.referral_count}x</Badge>
                              <Button size="sm" variant="ghost" className="text-teal-600 hover:bg-teal-50" onClick={() => { setTimelineStudent(s.student_name); setActiveTab("zaman-cizelgesi"); }}>
                                <GitBranch className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                        {students.filter(s => s.referral_count > 1).length === 0 && (
                          <p className="text-sm text-slate-400 text-center py-4">Birden fazla yönlendirmesi olan öğrenci yok</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </motion.div>
          </TabsContent>

          {/* ==================== ZAMAN ÇİZELGESİ TAB ==================== */}
          <TabsContent value="zaman-cizelgesi">
            <motion.div variants={slideIn} initial="hidden" animate="visible" className="space-y-6">
              {/* Öğrenci seçimi */}
              <Card className="border-slate-200">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-5 w-5 text-teal-600" />
                      <h3 className="font-semibold text-slate-800">Öğrenci Zaman Çizelgesi</h3>
                    </div>
                    <div className="flex-1 max-w-sm">
                      <Select value={timelineStudent} onValueChange={setTimelineStudent}>
                        <SelectTrigger className="bg-white"><SelectValue placeholder="Öğrenci seçin..." /></SelectTrigger>
                        <SelectContent>
                          {students.map((s) => (
                            <SelectItem key={s.student_name} value={s.student_name}>
                              {s.student_name} — {s.class_display} ({s.referral_count} yönlendirme)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {!timelineStudent ? (
                <div className="text-center py-16">
                  <div className="mx-auto w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4"><GitBranch className="h-8 w-8 text-teal-400" /></div>
                  <p className="text-slate-500 font-medium">Zaman çizelgesini görmek için öğrenci seçin</p>
                  <p className="text-slate-400 text-sm mt-1">Öğrencinin tüm yönlendirme, tutanak ve görüşme geçmişini kronolojik olarak gösterir</p>
                </div>
              ) : (
                <>
                  {/* Öğrenci özet kartı */}
                  {(() => {
                    const student = students.find(s => s.student_name === timelineStudent);
                    if (!student) return null;
                    const severity = getSeverityLevel(student.reasons);
                    return (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                          <CardContent className="p-5">
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-xl shadow-md">{student.student_name.charAt(0)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-slate-800 text-lg">{student.student_name}</h3>
                                  <Badge variant="outline" className="text-xs">{student.class_display}</Badge>
                                  <Badge className={`text-xs ${severity.color} bg-opacity-10 border`}>{severity.level} Risk</Badge>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                                  <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{student.teacher_name}</span>
                                  <span className="flex items-center gap-1"><Hash className="h-3.5 w-3.5" />{student.referral_count} yönlendirme</span>
                                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />İlk: {formatDate(student.first_referral)}</span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {student.reasons.map((r) => (
                                  <Badge key={r} variant="outline" className={`text-xs ${getReasonColor(r)}`}>{r}</Badge>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })()}

                  {/* Timeline */}
                  {timelineData.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">Bu öğrenci için zaman çizelgesi verisi bulunamadı</div>
                  ) : (
                    <div className="relative pl-8 space-y-0">
                      {/* Dikey çizgi */}
                      <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-teal-300 via-blue-300 to-purple-300" />

                      {timelineData.map((event, i) => {
                        const colorMap: Record<string, { bg: string; border: string; dot: string }> = {
                          teal: { bg: "bg-teal-50", border: "border-teal-200", dot: "bg-teal-500" },
                          blue: { bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500" },
                          purple: { bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-500" },
                          amber: { bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
                          emerald: { bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
                          pink: { bg: "bg-pink-50", border: "border-pink-200", dot: "bg-pink-500" },
                        };
                        const colors = colorMap[event.color] || colorMap.teal;

                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="relative pb-6"
                          >
                            {/* Dot */}
                            <div className={`absolute -left-8 top-3 w-4 h-4 rounded-full ${colors.dot} border-[3px] border-white shadow-sm z-10`} />

                            {/* Kart */}
                            <div className={`${colors.bg} border ${colors.border} rounded-xl p-4 ml-2`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-slate-800 text-sm">{event.title}</span>
                                <span className="text-xs text-slate-500">{formatDate(event.date)}</span>
                              </div>
                              <p className="text-sm text-slate-600">{event.detail}</p>
                              <Badge variant="outline" className={`text-xs mt-2 ${colors.border} ${colors.bg}`}>
                                {event.type === "referral" ? "Yönlendirme" : event.type === "tutanak" ? "Tutanak" : event.type === "case_note" ? "Vaka Notu" : "Veli İletişim"}
                              </Badge>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* Alt aksiyonlar */}
                  <div className="flex items-center gap-3 pt-2">
                    <Button size="sm" className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white" onClick={() => {
                      const student = students.find(s => s.student_name === timelineStudent);
                      if (student) handleDownload(student);
                    }}>
                      <Download className="h-4 w-4 mr-2" />Bu Öğrenci İçin Tutanak İndir
                    </Button>
                    <Button size="sm" variant="outline" className="border-teal-200 text-teal-700" onClick={() => {
                      const student = students.find(s => s.student_name === timelineStudent);
                      if (student) handlePreview(student);
                    }}>
                      <Eye className="h-4 w-4 mr-2" />Önizle
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </TabsContent>

          {/* ==================== DÜZENLE (EDİTÖR) TAB ==================== */}
          <TabsContent value="editor">
            <motion.div variants={slideIn} initial="hidden" animate="visible" className="space-y-4">
              {!editorContent ? (
                <div className="text-center py-16">
                  <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4"><Edit3 className="h-8 w-8 text-indigo-400" /></div>
                  <p className="text-slate-500 font-medium">Düzenlenecek tutanak seçilmedi</p>
                  <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
                    Otomatik listeden, geçmişten veya aşağıdaki butonlardan bir öğrenci seçerek tutanağı editörde açabilirsiniz
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                    {students.slice(0, 6).map((s) => (
                      <Button
                        key={s.student_name}
                        size="sm"
                        variant="outline"
                        className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                        onClick={() => {
                          const html = generateTutanakHtml(s, caseNotes[s.student_name] || []);
                          setEditorContent(html);
                          setEditorOriginalContent(html);
                          setEditorStudentName(s.student_name);
                        }}
                      >
                        <Edit3 className="h-3 w-3 mr-1" />{s.student_name}
                      </Button>
                    ))}
                    {students.length > 6 && <Badge variant="outline" className="text-xs text-slate-500">+{students.length - 6} öğrenci daha</Badge>}
                  </div>
                </div>
              ) : (
                <>
                  {/* Gelişmiş TipTap Editör */}
                  <AdvancedEditor
                    content={editorContent}
                    onChange={setEditorContent}
                    placeholder="Tutanak içeriğini düzenleyin..."
                    studentName={editorStudentName || undefined}
                    onReset={() => {
                      setEditorContent(editorOriginalContent);
                      toast.success("Orijinal içeriğe geri dönüldü");
                    }}
                    onCopy={() => {
                      navigator.clipboard.writeText(editorContent.replace(/<[^>]*>/g, ""));
                      toast.success("Metin panoya kopyalandı");
                    }}
                    onPreview={() => {
                      setPreviewHtml(DOMPurify.sanitize(editorContent));
                      setActiveTab("onizleme");
                    }}
                    onDownload={async () => {
                      try {
                        setGenerating(editorStudentName || "editor");
                        const today = new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
                        const fileName = `Tutanak_${(editorStudentName || "Belge").replace(/\s+/g, "_")}_${today.replace(/\./g, "-")}.docx`;
                        await htmlToDocx(editorContent, fileName);
                        toast.success("Düzenlenmiş tutanak indirildi");
                      } catch (error) {
                        console.error("Editor DOCX error:", error);
                        toast.error("DOCX oluşturulurken hata oluştu");
                      } finally {
                        setGenerating(null);
                      }
                    }}
                  />

                  {/* Kapat butonu */}
                  <div className="flex justify-end">
                    <Button size="sm" variant="ghost" className="text-slate-400 hover:text-slate-600" onClick={() => {
                      setEditorContent("");
                      setEditorStudentName("");
                      setEditorOriginalContent("");
                    }}>
                      <X className="h-4 w-4 mr-1" />Editörü Kapat
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="gecmis">
            <motion.div variants={slideIn} initial="hidden" animate="visible" className="space-y-4">
              {history.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"><History className="h-8 w-8 text-slate-400" /></div>
                  <p className="text-slate-500 font-medium">Henüz tutanak geçmişi yok</p>
                  <p className="text-slate-400 text-sm mt-1">Oluşturduğunuz tutanaklar burada listelenecektir</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">{history.length} tutanak kaydı</p>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={clearHistory}><Trash2 className="h-4 w-4 mr-1" />Geçmişi Temizle</Button>
                  </div>
                  <div className="space-y-2">
                    {history.map((entry) => {
                      // Geçmişteki öğrenciyi mevcut veriden veya geçmiş kaydından oluştur
                      const buildStudentFromHistory = (): StudentTutanak => {
                        const existing = students.find((s) => s.student_name === entry.student_name);
                        if (existing) return existing;
                        return {
                          student_name: entry.student_name,
                          class_display: entry.class_display,
                          class_key: "",
                          teacher_name: entry.teacher_name,
                          reasons: entry.reasons,
                          notes: [],
                          referral_count: 1,
                          first_referral: entry.date,
                          last_referral: entry.date,
                        };
                      };

                      return (
                        <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 hover:border-teal-200 hover:shadow-sm transition-all">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${entry.type === "manual" ? "bg-purple-100" : "bg-teal-100"}`}>
                            {entry.type === "manual" ? <PenLine className="h-5 w-5 text-purple-600" /> : <Sparkles className="h-5 w-5 text-teal-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-800">{entry.student_name}</span>
                              <Badge variant="outline" className="text-xs">{entry.class_display}</Badge>
                              <Badge className={`text-xs ${entry.type === "manual" ? "bg-purple-100 text-purple-700" : "bg-teal-100 text-teal-700"}`}>{entry.type === "manual" ? "Manuel" : "Otomatik"}</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                              <span>{entry.teacher_name}</span>
                              <span>{formatDate(entry.date)}</span>
                              <span>{entry.reasons.length} neden</span>
                            </div>
                          </div>
                          <div className="hidden md:flex flex-wrap gap-1 max-w-xs">
                            {entry.reasons.slice(0, 2).map((r) => (
                              <Badge key={r} variant="outline" className={`text-xs ${getReasonColor(r)}`}>{r.length > 20 ? r.slice(0, 20) + "..." : r}</Badge>
                            ))}
                            {entry.reasons.length > 2 && <Badge variant="outline" className="text-xs bg-slate-50">+{entry.reasons.length - 2}</Badge>}
                          </div>
                          {/* Aksiyon butonları */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button size="sm" variant="ghost" className="text-teal-600 hover:bg-teal-50" title="Önizle" onClick={() => {
                              if (entry.content_html) {
                                setPreviewHtml(DOMPurify.sanitize(entry.content_html));
                                setEditorStudentName(entry.student_name);
                              } else {
                                const s = buildStudentFromHistory();
                                setPreviewStudent(s);
                              }
                              setActiveTab("onizleme");
                            }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-emerald-600 hover:bg-emerald-50" title="Tekrar İndir" disabled={generating === entry.student_name} onClick={() => {
                              const s = buildStudentFromHistory();
                              handleDownload(s);
                            }}>
                              {generating === entry.student_name ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                            </Button>
                            <Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50" title="Zaman Çizelgesi" onClick={() => {
                              setTimelineStudent(entry.student_name);
                              setActiveTab("zaman-cizelgesi");
                            }}>
                              <GitBranch className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-indigo-600 hover:bg-indigo-50" title="Düzenle" onClick={() => {
                              const html = entry.content_html || (() => {
                                const s = buildStudentFromHistory();
                                return generateTutanakHtml(s, caseNotes[s.student_name] || []);
                              })();
                              setEditorContent(html);
                              setEditorOriginalContent(html);
                              setEditorStudentName(entry.student_name);
                              setActiveTab("editor");
                            }}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" title="Sil" onClick={() => {
                              deleteFromHistory(entry.id);
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
