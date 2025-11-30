"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Gavel,
  GraduationCap, 
  User, 
  RefreshCw,
  FileType,
  FileDown,
  Calendar,
  Clock,
  Save,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Plus,
  ChevronRight,
  ChevronLeft,
  Check,
  FileText,
  Send,
  MessageCircle,
  Printer,
  ClipboardList,
  Scale,
  UserX,
  FileWarning,
  BookOpen,
  ShieldAlert,
  FileSignature,
  Ban,
  Building2
} from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { YONLENDIRME_NEDENLERI, DISIPLIN_CEZALARI } from "@/types";

// RichTextEditor'u dinamik olarak yükle
const RichTextEditor = dynamic(
  () => import("@/components/RichTextEditor").then((mod) => mod.RichTextEditor),
  { 
    ssr: false,
    loading: () => (
      <div className="border border-slate-200 rounded-lg bg-white h-[400px] flex items-center justify-center text-slate-400">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
        Editör yükleniyor...
      </div>
    )
  }
);

interface Student {
  value: string;
  text: string;
}

interface ClassOption {
  value: string;
  text: string;
}

// Disiplin belge türleri
type DisiplinDocType = 
  | "ogrenci-ifade" 
  | "tanik-ifade" 
  | "veli-bilgilendirme" 
  | "disiplin-cagri" 
  | "disiplin-karar"
  | "uyari-belgesi"
  | "sozlu-uyari"
  | "ogrenci-sozlesmesi"
  | "kinama-belgesi"
  | "okul-degisikligi";

interface DisiplinDocument {
  id: DisiplinDocType;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

const disiplinDocuments: DisiplinDocument[] = [
  { 
    id: "ogrenci-ifade", 
    label: "Öğrenci İfade Tutanağı", 
    icon: User, 
    color: "text-blue-600 bg-blue-50 border-blue-200",
    description: "Öğrencinin olaya ilişkin ifadesi"
  },
  { 
    id: "tanik-ifade", 
    label: "Tanık İfade Tutanağı", 
    icon: UserX, 
    color: "text-purple-600 bg-purple-50 border-purple-200",
    description: "Tanık öğrencilerin ifadeleri"
  },
  { 
    id: "veli-bilgilendirme", 
    label: "Veli Bilgilendirme Yazısı", 
    icon: FileWarning, 
    color: "text-amber-600 bg-amber-50 border-amber-200",
    description: "Veliye durum bildirimi"
  },
  { 
    id: "disiplin-cagri", 
    label: "Disiplin Kurulu Çağrısı", 
    icon: Gavel, 
    color: "text-rose-600 bg-rose-50 border-rose-200",
    description: "Kurul toplantısına davet"
  },
  { 
    id: "disiplin-karar", 
    label: "Disiplin Kurulu Kararı", 
    icon: Scale, 
    color: "text-red-600 bg-red-50 border-red-200",
    description: "Kurul karar tutanağı"
  },
  { 
    id: "uyari-belgesi", 
    label: "Uyarı Belgesi", 
    icon: AlertTriangle, 
    color: "text-orange-600 bg-orange-50 border-orange-200",
    description: "Öğrenci uyarı yazısı"
  },
];

// Ceza belgeleri
const cezaDocuments: DisiplinDocument[] = [
  { 
    id: "sozlu-uyari", 
    label: "Sözlü Uyarı Belgesi", 
    icon: ShieldAlert, 
    color: "text-yellow-600 bg-yellow-50 border-yellow-200",
    description: "Sözlü uyarı tutanağı"
  },
  { 
    id: "ogrenci-sozlesmesi", 
    label: "Öğrenci Sözleşmesi", 
    icon: FileSignature, 
    color: "text-cyan-600 bg-cyan-50 border-cyan-200",
    description: "Davranış sözleşmesi imzalama"
  },
  { 
    id: "kinama-belgesi", 
    label: "Kınama Belgesi", 
    icon: Ban, 
    color: "text-red-600 bg-red-50 border-red-200",
    description: "Resmi kınama cezası"
  },
  { 
    id: "okul-degisikligi", 
    label: "Okul Değişikliği Talebi", 
    icon: Building2, 
    color: "text-slate-600 bg-slate-50 border-slate-200",
    description: "Okul değişikliği talep yazısı"
  },
];

export default function DisiplinPage() {
  // Seçim state'leri
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedClassText, setSelectedClassText] = useState<string>("");
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  // Tarih ve neden seçimi
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [selectedPenalty, setSelectedPenalty] = useState<string>("");
  const [savingPenalty, setSavingPenalty] = useState(false);
  
  // Toplantı bilgileri
  const [meetingDate, setMeetingDate] = useState<string>("");
  const [meetingTime, setMeetingTime] = useState<string>("");
  
  // Belge state'leri
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<DisiplinDocType>("ogrenci-ifade");
  const [documentContent, setDocumentContent] = useState<string>("");
  const [exportingWord, setExportingWord] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  
  // Kaydedilen belgeler
  const [savedDocuments, setSavedDocuments] = useState<Record<DisiplinDocType, string>>({
    "ogrenci-ifade": "",
    "tanik-ifade": "",
    "veli-bilgilendirme": "",
    "disiplin-cagri": "",
    "disiplin-karar": "",
    "uyari-belgesi": "",
    "sozlu-uyari": "",
    "ogrenci-sozlesmesi": "",
    "kinama-belgesi": "",
    "okul-degisikligi": ""
  });

  // Tarih formatları
  const today = new Date();
  const formattedToday = today.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

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

  // Sınıf seçimi
  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    const classText = classes.find(c => c.value === value)?.text || value;
    setSelectedClassText(classText);
    setSelectedStudent(null);
    loadStudents(value);
  };

  // Öğrenci seçimi
  const handleStudentChange = (value: string) => {
    const student = students.find(s => s.value === value);
    if (student) {
      setSelectedStudent(student);
    }
  };

  // Belge şablonları oluştur
  const generateDocumentContent = (type: DisiplinDocType): string => {
    const studentName = selectedStudent?.text || "[Öğrenci Seçilmedi]";
    const className = selectedClassText || "[Sınıf Seçilmedi]";
    const reason = selectedReason || "[Neden Seçilmedi]";
    const eventDate = selectedDate 
      ? new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
      : "[Tarih Seçilmedi]";
    const meetingDateFormatted = meetingDate 
      ? new Date(meetingDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
      : "____/____/________";
    const meetingTimeFormatted = meetingTime || "____:____";

    const header = `<p style="text-align: center"><strong>T.C.</strong></p>
<p style="text-align: center"><strong>BİRECİK KAYMAKAMLIĞI</strong></p>
<p style="text-align: center"><strong>DUMLUPINAR İLKOKULU MÜDÜRLÜĞÜ</strong></p>
<p></p>`;

    const signature = `<p></p>
<p style="text-align: right"><strong>____________________</strong></p>
<p style="text-align: right">Okul Müdürü</p>`;

    const templates: Record<DisiplinDocType, string> = {
      "ogrenci-ifade": `${header}
<p style="text-align: center"><strong>ÖĞRENCİ İFADE TUTANAĞI</strong></p>
<p></p>
<p><strong>Tarih:</strong> ${formattedToday}</p>
<p><strong>Olay Tarihi:</strong> ${eventDate}</p>
<p><strong>Sayı:</strong> ____________________</p>
<p></p>
<p><strong>İFADE VEREN ÖĞRENCİ BİLGİLERİ:</strong></p>
<p><strong>Adı Soyadı:</strong> ${studentName}</p>
<p><strong>Sınıfı:</strong> ${className}</p>
<p><strong>Olay Konusu:</strong> ${reason}</p>
<p></p>
<p><strong>ÖĞRENCİ İFADESİ:</strong></p>
<p></p>
<p>________________________________________________________________________</p>
<p>________________________________________________________________________</p>
<p>________________________________________________________________________</p>
<p>________________________________________________________________________</p>
<p>________________________________________________________________________</p>
<p>________________________________________________________________________</p>
<p>________________________________________________________________________</p>
<p>________________________________________________________________________</p>
<p></p>
<p><em>Yukarıdaki ifademin doğru olduğunu beyan ederim.</em></p>
<p></p>
<p></p>
<table style="width: 100%;">
<tr>
<td style="width: 50%;"><strong>İfade Veren Öğrenci</strong></td>
<td style="width: 50%; text-align: right;"><strong>İfade Alan Yetkili</strong></td>
</tr>
<tr>
<td>${studentName}</td>
<td style="text-align: right;">____________________</td>
</tr>
<tr>
<td>İmza: ____________</td>
<td style="text-align: right;">İmza: ____________</td>
</tr>
</table>`,

      "tanik-ifade": `${header}
<p style="text-align: center"><strong>TANIK İFADE TUTANAĞI</strong></p>
<p></p>
<p><strong>Tarih:</strong> ${formattedToday}</p>
<p><strong>Olay Tarihi:</strong> ${eventDate}</p>
<p><strong>Sayı:</strong> ____________________</p>
<p></p>
<p><strong>OLAY BİLGİLERİ:</strong></p>
<p><strong>İlgili Öğrenci:</strong> ${studentName} - ${className}</p>
<p><strong>Olay Konusu:</strong> ${reason}</p>
<p></p>
<p><strong>TANIK ÖĞRENCİ BİLGİLERİ:</strong></p>
<p><strong>Adı Soyadı:</strong> ____________________</p>
<p><strong>Sınıfı:</strong> ____________________</p>
<p></p>
<p><strong>TANIK İFADESİ:</strong></p>
<p></p>
<p>________________________________________________________________________</p>
<p>________________________________________________________________________</p>
<p>________________________________________________________________________</p>
<p>________________________________________________________________________</p>
<p>________________________________________________________________________</p>
<p>________________________________________________________________________</p>
<p></p>
<p><em>Yukarıdaki ifademin doğru olduğunu beyan ederim.</em></p>
<p></p>
<p></p>
<table style="width: 100%;">
<tr>
<td style="width: 50%;"><strong>İfade Veren Tanık</strong></td>
<td style="width: 50%; text-align: right;"><strong>İfade Alan Yetkili</strong></td>
</tr>
<tr>
<td>____________________</td>
<td style="text-align: right;">____________________</td>
</tr>
<tr>
<td>İmza: ____________</td>
<td style="text-align: right;">İmza: ____________</td>
</tr>
</table>`,

      "veli-bilgilendirme": `${header}
<p style="text-align: center"><strong>VELİ BİLGİLENDİRME YAZISI</strong></p>
<p></p>
<p><strong>Tarih:</strong> ${formattedToday}</p>
<p><strong>Sayı:</strong> ____________________</p>
<p><strong>Konu:</strong> Disiplin Olayı Hakkında Bilgilendirme</p>
<p></p>
<p>SAYIN VELİ,</p>
<p></p>
<p>Okulumuz ${className} sınıfı öğrencisi "<strong>${studentName}</strong>" hakkında ${eventDate} tarihinde yaşanan olay nedeniyle sizleri bilgilendirmek istiyoruz.</p>
<p></p>
<p><strong>OLAY KONUSU:</strong></p>
<p>${reason}</p>
<p></p>
<p><strong>OLAY ÖZETİ:</strong></p>
<p>________________________________________________________________________</p>
<p>________________________________________________________________________</p>
<p>________________________________________________________________________</p>
<p></p>
<p><strong>YAPILAN / YAPILACAK İŞLEMLER:</strong></p>
<ul>
<li>Öğrencinin ifadesi alınmıştır.</li>
<li>Tanık ifadeleri değerlendirilmiştir.</li>
<li>Okul yönetimi tarafından gerekli tedbirler alınmaktadır.</li>
</ul>
<p></p>
<p>Öğrencinizin eğitim hayatının sağlıklı bir şekilde devam edebilmesi için veli-okul işbirliğinin önemini hatırlatır, en kısa sürede okul idaresi ile görüşmenizi rica ederiz.</p>
<p></p>
<p>Bilgilerinize sunarız.</p>
${signature}
<p></p>
<p><strong>Veli Adı Soyadı:</strong> ____________________</p>
<p><strong>Veli İmzası:</strong> ____________________</p>
<p><strong>Tebliğ Tarihi:</strong> ____/____/________</p>`,

      "disiplin-cagri": `${header}
<p style="text-align: center"><strong>DİSİPLİN KURULU TOPLANTI ÇAĞRISI</strong></p>
<p></p>
<p><strong>Tarih:</strong> ${formattedToday}</p>
<p><strong>Sayı:</strong> ____________________</p>
<p><strong>Konu:</strong> Disiplin Kurulu Toplantısına Çağrı</p>
<p></p>
<p>SAYIN VELİ,</p>
<p></p>
<p>Okulumuz ${className} sınıfı öğrencisi "<strong>${studentName}</strong>" hakkında ${eventDate} tarihinde yaşanan "<strong>${reason}</strong>" olayı nedeniyle açılan disiplin soruşturması kapsamında, öğrenci velisi olarak aşağıda belirtilen tarih ve saatte okulumuz Disiplin Kurulu toplantısına katılmanız gerekmektedir.</p>
<p></p>
<p><strong>TOPLANTI BİLGİLERİ:</strong></p>
<p><strong>Toplantı Tarihi:</strong> ${meetingDateFormatted}</p>
<p><strong>Toplantı Saati:</strong> ${meetingTimeFormatted}</p>
<p><strong>Toplantı Yeri:</strong> Okul Müdürlüğü / Toplantı Salonu</p>
<p></p>
<p><strong>ÖNEMLİ NOTLAR:</strong></p>
<ul>
<li>Toplantıya kimlik belgenizle birlikte gelmeniz gerekmektedir.</li>
<li>Toplantıda öğrencinizin savunmasını yapma hakkınız bulunmaktadır.</li>
<li>Belirtilen tarihte gelememeniz durumunda yazılı mazeret bildirmeniz gerekmektedir.</li>
<li>Mazeretsiz katılım sağlanmaması halinde işlemler gıyabınızda yapılacaktır.</li>
</ul>
<p></p>
<p>Bilgilerinize önemle rica ederim.</p>
${signature}
<p></p>
<p><strong>Tebliğ Alan Veli:</strong> ____________________</p>
<p><strong>İmza:</strong> ____________________</p>
<p><strong>Tebliğ Tarihi:</strong> ____/____/________</p>`,

      "disiplin-karar": `${header}
<p style="text-align: center"><strong>DİSİPLİN KURULU KARAR TUTANAĞI</strong></p>
<p></p>
<p><strong>Karar Tarihi:</strong> ${formattedToday}</p>
<p><strong>Karar No:</strong> ____________________</p>
<p></p>
<p><strong>TOPLANTI BİLGİLERİ:</strong></p>
<p>Okulumuz Disiplin Kurulu, aşağıda isimleri yazılı üyelerin katılımıyla ${formattedToday} tarihinde toplanmış ve gündemdeki konuyu görüşmüştür.</p>
<p></p>
<p><strong>KURUL ÜYELERİ:</strong></p>
<ol>
<li>____________________ (Okul Müdürü - Başkan)</li>
<li>____________________ (Müdür Yardımcısı)</li>
<li>____________________ (Öğretmen)</li>
<li>____________________ (Öğretmen)</li>
<li>____________________ (Rehber Öğretmen)</li>
</ol>
<p></p>
<p><strong>GÖRÜŞÜLEN KONU:</strong></p>
<p><strong>Öğrenci:</strong> ${studentName}</p>
<p><strong>Sınıfı:</strong> ${className}</p>
<p><strong>Olay Tarihi:</strong> ${eventDate}</p>
<p><strong>Olay Konusu:</strong> ${reason}</p>
<p></p>
<p><strong>OLAY ÖZETİ:</strong></p>
<p>________________________________________________________________________</p>
<p>________________________________________________________________________</p>
<p>________________________________________________________________________</p>
<p></p>
<p><strong>DEĞERLENDİRME:</strong></p>
<p>Öğrenci ifadesi, tanık ifadeleri ve toplanan deliller incelenmiş, ilgili mevzuat hükümleri değerlendirilmiştir.</p>
<p></p>
<p><strong>KARAR:</strong></p>
<p>Yapılan görüşme ve değerlendirmeler sonucunda;</p>
<p></p>
<p>☐ Öğrenciye UYARI cezası verilmesine,</p>
<p>☐ Öğrenciye KINAMA cezası verilmesine,</p>
<p>☐ Öğrencinin ______ gün OKULA DEVAMSIZLIK cezası almasına,</p>
<p>☐ Ceza verilmesine YER OLMADIĞINA,</p>
<p></p>
<p>oybirliği/oyçokluğu ile karar verilmiştir.</p>
<p></p>
<p><strong>KURUL ÜYELERİ İMZALARI:</strong></p>
<p></p>
<table style="width: 100%;">
<tr>
<td style="width: 33%;"><strong>1. ____________________</strong><br/>İmza:</td>
<td style="width: 33%;"><strong>2. ____________________</strong><br/>İmza:</td>
<td style="width: 33%;"><strong>3. ____________________</strong><br/>İmza:</td>
</tr>
<tr>
<td><strong>4. ____________________</strong><br/>İmza:</td>
<td><strong>5. ____________________</strong><br/>İmza:</td>
<td></td>
</tr>
</table>`,

      "uyari-belgesi": `${header}
<p style="text-align: center"><strong>ÖĞRENCİ UYARI BELGESİ</strong></p>
<p></p>
<p><strong>Tarih:</strong> ${formattedToday}</p>
<p><strong>Sayı:</strong> ____________________</p>
<p></p>
<p><strong>ÖĞRENCİ BİLGİLERİ:</strong></p>
<p><strong>Adı Soyadı:</strong> ${studentName}</p>
<p><strong>Sınıfı:</strong> ${className}</p>
<p><strong>Numarası:</strong> ____________________</p>
<p></p>
<p><strong>UYARI KONUSU:</strong></p>
<p>${reason}</p>
<p></p>
<p><strong>OLAY TARİHİ:</strong> ${eventDate}</p>
<p></p>
<p><strong>AÇIKLAMA:</strong></p>
<p>________________________________________________________________________</p>
<p>________________________________________________________________________</p>
<p>________________________________________________________________________</p>
<p></p>
<p><strong>UYARI:</strong></p>
<p>Yukarıda belirtilen davranışın tekrarlanması halinde disiplin işlemi başlatılacağı ve velinin okula çağrılacağı öğrenciye bildirilmiştir.</p>
<p></p>
<p>Öğrencimizin bundan sonraki süreçte okul kurallarına uyması beklenmektedir.</p>
<p></p>
<p></p>
<table style="width: 100%;">
<tr>
<td style="width: 33%;"><strong>Öğrenci</strong></td>
<td style="width: 33%;"><strong>Sınıf Öğretmeni</strong></td>
<td style="width: 33%;"><strong>Okul Müdürü</strong></td>
</tr>
<tr>
<td>${studentName}</td>
<td>____________________</td>
<td>____________________</td>
</tr>
<tr>
<td>İmza: ____________</td>
<td>İmza: ____________</td>
<td>İmza: ____________</td>
</tr>
</table>
<p></p>
<p><strong>VELİ BİLGİLENDİRME:</strong></p>
<p><strong>Veli Adı Soyadı:</strong> ____________________</p>
<p><strong>Veli İmzası:</strong> ____________________</p>
<p><strong>Tebliğ Tarihi:</strong> ____/____/________</p>`,

      // CEZA BELGELERİ
      "sozlu-uyari": `${header}
<p style="text-align: center"><strong>SÖZLÜ UYARI BELGESİ</strong></p>
<p></p>
<p><strong>Tarih:</strong> ${formattedToday}</p>
<p><strong>Sayı:</strong> ____________________</p>
<p></p>
<p><strong>ÖĞRENCİ BİLGİLERİ:</strong></p>
<p><strong>Adı Soyadı:</strong> ${studentName}</p>
<p><strong>Sınıfı:</strong> ${className}</p>
<p></p>
<p><strong>OLAY TARİHİ:</strong> ${eventDate}</p>
<p><strong>OLAY KONUSU:</strong> ${reason}</p>
<p></p>
<p><strong>VERİLEN CEZA:</strong> <mark>SÖZLÜ UYARI</mark></p>
<p></p>
<p><strong>AÇIKLAMA:</strong></p>
<p>Yukarıda belirtilen olay nedeniyle öğrenciye sözlü uyarı verilmiştir. Bu uyarı, öğrencinin disiplin dosyasına işlenmiştir.</p>
<p></p>
<p>Öğrencimizin bundan sonraki süreçte okul kurallarına uyması beklenmektedir. Benzer durumların tekrarı halinde daha üst düzey disiplin işlemleri uygulanacaktır.</p>
<p></p>
<table style="width: 100%;">
<tr>
<td style="width: 50%;"><strong>Öğrenci</strong></td>
<td style="width: 50%;"><strong>Okul Müdürü</strong></td>
</tr>
<tr>
<td>${studentName}</td>
<td>____________________</td>
</tr>
<tr>
<td>İmza: ____________</td>
<td>İmza: ____________</td>
</tr>
</table>
<p></p>
<p><strong>VELİ TEBLİĞ:</strong></p>
<p><strong>Veli Adı Soyadı:</strong> ____________________</p>
<p><strong>Veli İmzası:</strong> ____________________</p>
<p><strong>Tebliğ Tarihi:</strong> ____/____/________</p>`,

      "ogrenci-sozlesmesi": `${header}
<p style="text-align: center"><strong>ÖĞRENCİ SÖZLEŞME BELGESİ</strong></p>
<p></p>
<p><strong>Tarih:</strong> ${formattedToday}</p>
<p><strong>Sayı:</strong> ____________________</p>
<p></p>
<p><strong>ÖĞRENCİ BİLGİLERİ:</strong></p>
<p><strong>Adı Soyadı:</strong> ${studentName}</p>
<p><strong>Sınıfı:</strong> ${className}</p>
<p></p>
<p><strong>OLAY TARİHİ:</strong> ${eventDate}</p>
<p><strong>OLAY KONUSU:</strong> ${reason}</p>
<p></p>
<p><strong>VERİLEN CEZA:</strong> <mark>ÖĞRENCİ SÖZLEŞMESİ İMZALAMA</mark></p>
<p></p>
<p style="text-align: center"><strong>TAAHHÜTNAME</strong></p>
<p></p>
<p>Ben, ${studentName}, ${className} sınıfı öğrencisi olarak;</p>
<p></p>
<ul>
<li>Okul kurallarına uyacağıma,</li>
<li>Öğretmenlerime ve okul personeline saygılı davranacağıma,</li>
<li>Arkadaşlarıma karşı hoşgörülü ve anlayışlı olacağıma,</li>
<li>Okulun fiziki yapısına ve malzemelerine zarar vermeyeceğime,</li>
<li>Derslere düzenli katılacağıma ve ödevlerimi yapacağıma,</li>
<li>Benzer olumsuz davranışları tekrarlamayacağıma,</li>
</ul>
<p></p>
<p>söz veriyor, bu taahhütlere uymam halinde hakkımda disiplin işlemi başlatılacağını biliyorum.</p>
<p></p>
<table style="width: 100%;">
<tr>
<td style="width: 33%;"><strong>Öğrenci</strong></td>
<td style="width: 33%;"><strong>Veli</strong></td>
<td style="width: 33%;"><strong>Okul Müdürü</strong></td>
</tr>
<tr>
<td>${studentName}</td>
<td>____________________</td>
<td>____________________</td>
</tr>
<tr>
<td>İmza: ____________</td>
<td>İmza: ____________</td>
<td>İmza: ____________</td>
</tr>
</table>`,

      "kinama-belgesi": `${header}
<p style="text-align: center"><strong>KINAMA CEZASI BELGESİ</strong></p>
<p></p>
<p><strong>Tarih:</strong> ${formattedToday}</p>
<p><strong>Sayı:</strong> ____________________</p>
<p><strong>Karar No:</strong> ____________________</p>
<p></p>
<p><strong>ÖĞRENCİ BİLGİLERİ:</strong></p>
<p><strong>Adı Soyadı:</strong> ${studentName}</p>
<p><strong>Sınıfı:</strong> ${className}</p>
<p></p>
<p><strong>OLAY TARİHİ:</strong> ${eventDate}</p>
<p><strong>OLAY KONUSU:</strong> ${reason}</p>
<p></p>
<p><strong>VERİLEN CEZA:</strong> <mark>KINAMA</mark></p>
<p></p>
<p><strong>GEREKÇE:</strong></p>
<p>Öğrencinin yukarıda belirtilen olay kapsamında sergilediği davranış, okul disiplin yönetmeliği çerçevesinde değerlendirilmiş olup, KINAMA cezası verilmesine karar verilmiştir.</p>
<p></p>
<p><strong>YASAL DAYANAK:</strong></p>
<p>Milli Eğitim Bakanlığı Okul Öncesi Eğitim ve İlköğretim Kurumları Yönetmeliği ilgili maddeleri gereğince</p>
<p></p>
<p><strong>KARAR:</strong></p>
<p>${studentName} adlı öğrenciye KINAMA cezası verilmiştir. Bu ceza öğrencinin disiplin dosyasına işlenecektir.</p>
<p></p>
<p><strong>NOT:</strong> Bu karara karşı tebliğ tarihinden itibaren 5 (beş) iş günü içerisinde İl/İlçe Milli Eğitim Müdürlüğü'ne itiraz edilebilir.</p>
<p></p>
${signature}
<p></p>
<p><strong>TEBLİĞ BİLGİLERİ:</strong></p>
<p><strong>Öğrenci İmzası:</strong> ____________________</p>
<p><strong>Veli Adı Soyadı:</strong> ____________________</p>
<p><strong>Veli İmzası:</strong> ____________________</p>
<p><strong>Tebliğ Tarihi:</strong> ____/____/________</p>`,

      "okul-degisikligi": `${header}
<p style="text-align: center"><strong>OKUL DEĞİŞİKLİĞİ TALEBİ BELGESİ</strong></p>
<p></p>
<p><strong>Tarih:</strong> ${formattedToday}</p>
<p><strong>Sayı:</strong> ____________________</p>
<p><strong>Karar No:</strong> ____________________</p>
<p></p>
<p><strong>ÖĞRENCİ BİLGİLERİ:</strong></p>
<p><strong>Adı Soyadı:</strong> ${studentName}</p>
<p><strong>Sınıfı:</strong> ${className}</p>
<p><strong>T.C. Kimlik No:</strong> ____________________</p>
<p></p>
<p><strong>OLAY TARİHİ:</strong> ${eventDate}</p>
<p><strong>OLAY KONUSU:</strong> ${reason}</p>
<p></p>
<p><strong>VERİLEN CEZA:</strong> <mark>OKUL DEĞİŞİKLİĞİ TALEBİ</mark></p>
<p></p>
<p><strong>GEREKÇE:</strong></p>
<p>Öğrencinin yukarıda belirtilen olay/olaylar kapsamında sergilediği davranışlar, okul disiplin yönetmeliği ve ilgili mevzuat çerçevesinde değerlendirilmiştir. Yapılan inceleme sonucunda öğrencinin eğitimine farklı bir eğitim kurumunda devam etmesinin uygun olacağına karar verilmiştir.</p>
<p></p>
<p><strong>YASAL DAYANAK:</strong></p>
<p>Milli Eğitim Bakanlığı Okul Öncesi Eğitim ve İlköğretim Kurumları Yönetmeliği ilgili maddeleri gereğince</p>
<p></p>
<p><strong>KARAR:</strong></p>
<p>${studentName} adlı öğrencinin OKUL DEĞİŞİKLİĞİ yapması talep edilmektedir. Bu karar İlçe Milli Eğitim Müdürlüğü'ne iletilecektir.</p>
<p></p>
<p><strong>NOT:</strong> Bu karara karşı tebliğ tarihinden itibaren 5 (beş) iş günü içerisinde İl Milli Eğitim Müdürlüğü'ne itiraz edilebilir.</p>
<p></p>
${signature}
<p></p>
<p><strong>TEBLİĞ BİLGİLERİ:</strong></p>
<p><strong>Öğrenci İmzası:</strong> ____________________</p>
<p><strong>Veli Adı Soyadı:</strong> ____________________</p>
<p><strong>Veli İmzası:</strong> ____________________</p>
<p><strong>Tebliğ Tarihi:</strong> ____/____/________</p>`,
    };

    return templates[type] || "";
  };

  // Belge içeriğini güncelle
  const updateDocumentContent = (type: DisiplinDocType) => {
    // Eğer kaydedilmiş içerik varsa onu kullan
    if (savedDocuments[type]) {
      setDocumentContent(savedDocuments[type]);
    } else {
      const content = generateDocumentContent(type);
      setDocumentContent(content);
    }
  };

  // Belge tipi değiştiğinde
  const handleDocumentChange = (type: DisiplinDocType) => {
    // Mevcut içeriği kaydet
    setSavedDocuments(prev => ({
      ...prev,
      [selectedDocument]: documentContent
    }));
    
    setSelectedDocument(type);
    updateDocumentContent(type);
  };

  // Seçimler değiştiğinde belgeyi yeniden oluştur
  useEffect(() => {
    if (selectedStudent && selectedReason && selectedDate) {
      const content = generateDocumentContent(selectedDocument);
      setDocumentContent(content);
    }
  }, [selectedStudent, selectedReason, selectedDate, meetingDate, meetingTime]);

  // İlk yüklemede
  useEffect(() => {
    updateDocumentContent(selectedDocument);
  }, []);

  // İçeriği kaydet
  const handleSaveContent = () => {
    setSavedDocuments(prev => ({
      ...prev,
      [selectedDocument]: documentContent
    }));
    toast.success("Belge kaydedildi!");
  };

  // Şablona sıfırla
  const handleResetContent = () => {
    const content = generateDocumentContent(selectedDocument);
    setDocumentContent(content);
    toast.info("Belge şablona sıfırlandı");
  };

  // İçeriği temizle
  const handleClearContent = () => {
    setDocumentContent("");
    toast.info("Belge içeriği temizlendi");
  };

  // HTML'den düz metin çıkar
  const htmlToPlainText = (html: string): string => {
    let text = html
      .replace(/<p><\/p>/g, '\n')
      .replace(/<p[^>]*>/g, '')
      .replace(/<\/p>/g, '\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<li>/g, '\u2022 ')
      .replace(/<\/li>/g, '\n')
      .replace(/<ul>|<\/ul>|<ol>|<\/ol>/g, '')
      .replace(/<strong>|<\/strong>|<b>|<\/b>/g, '*')
      .replace(/<em>|<\/em>|<i>|<\/i>/g, '_')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return text;
  };

  // WhatsApp'ta paylaş
  const shareOnWhatsApp = () => {
    if (!documentContent) return;
    const plainText = htmlToPlainText(documentContent);
    const encodedText = encodeURIComponent(plainText);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    toast.success("WhatsApp açılıyor...");
  };

  // Telegram'da paylaş
  const shareOnTelegram = () => {
    if (!documentContent) return;
    const plainText = htmlToPlainText(documentContent);
    const encodedText = encodeURIComponent(plainText);
    window.open(`https://t.me/share/url?text=${encodedText}`, '_blank');
    toast.success("Telegram açılıyor...");
  };

  // Word olarak indir
  const downloadAsWord = () => {
    if (!documentContent) return;
    setExportingWord(true);
    
    try {
      const selectedDoc = disiplinDocuments.find(d => d.id === selectedDocument) || cezaDocuments.find(d => d.id === selectedDocument);
      const fileName = `${selectedDoc?.label || 'Belge'}_${selectedStudent?.text || 'Öğrenci'}.doc`.replace(/\s+/g, '_');
      
      const processedContent = documentContent
        .replace(/<p><\/p>/g, '<p>&nbsp;</p>')
        .replace(/<p>\s*<br\s*\/?>\s*<\/p>/g, '<p>&nbsp;</p>');
      
      const htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>${selectedDoc?.label}</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.8; padding: 40px; }
            p { margin: 0; padding: 0; min-height: 1.2em; }
            table { border-collapse: collapse; width: 100%; }
            td, th { padding: 8px; vertical-align: top; }
            ul, ol { margin: 0.5em 0; padding-left: 1.5em; }
          </style>
        </head>
        <body>${processedContent}</body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Word dosyası indirildi!");
    } catch (error) {
      toast.error("Word dosyası oluşturulamadı");
    } finally {
      setExportingWord(false);
    }
  };

  // PDF olarak indir
  const downloadAsPdf = () => {
    if (!documentContent) return;
    setExportingPdf(true);
    
    try {
      const selectedDoc = disiplinDocuments.find(d => d.id === selectedDocument) || cezaDocuments.find(d => d.id === selectedDocument);
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        toast.error("Pop-up engelleyici aktif olabilir");
        setExportingPdf(false);
        return;
      }
      
      const processedContent = documentContent
        .replace(/<p><\/p>/g, '<p>&nbsp;</p>')
        .replace(/<p>\s*<br\s*\/?>\s*<\/p>/g, '<p>&nbsp;</p>');
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${selectedDoc?.label} - ${selectedStudent?.text || 'Öğrenci'}</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.8; padding: 40px; color: #333; }
            p { margin: 0; padding: 0; min-height: 1.2em; }
            table { border-collapse: collapse; width: 100%; }
            td, th { padding: 8px; vertical-align: top; }
            ul, ol { margin: 0.5em 0; padding-left: 1.5em; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>${processedContent}</body>
        </html>
      `;
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        toast.success("PDF olarak kaydetmek için 'PDF olarak kaydet' seçin");
      }, 500);
    } catch (error) {
      toast.error("PDF dosyası oluşturulamadı");
    } finally {
      setExportingPdf(false);
    }
  };

  // Cezayı öğrenci geçmişine kaydet
  const handleSavePenalty = async () => {
    if (!selectedStudent || !selectedPenalty || !selectedDate || !selectedReason) {
      toast.error("Lütfen öğrenci, ceza türü, tarih ve olay nedeni seçin");
      return;
    }

    setSavingPenalty(true);
    try {
      const response = await fetch('/api/discipline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: selectedStudent.value,
          student_name: selectedStudent.text,
          class_key: selectedClass,
          class_display: selectedClassText,
          event_date: selectedDate,
          reason: selectedReason,
          penalty_type: selectedPenalty,
          notes: null,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(`${selectedPenalty} cezası öğrenci geçmişine kaydedildi`);
      } else {
        toast.error(result.error || "Ceza kaydedilemedi");
      }
    } catch (error) {
      console.error("Save penalty error:", error);
      toast.error("Ceza kaydedilirken bir hata oluştu");
    } finally {
      setSavingPenalty(false);
    }
  };

  // Adım kontrolleri
  const canProceed = selectedStudent && selectedReason && selectedDate;
  const canSavePenalty = selectedStudent && selectedPenalty && selectedDate && selectedReason;

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Gavel className="h-7 w-7 text-rose-600" />
            Disiplin İşlemleri
          </h1>
          <p className="text-sm text-slate-500 mt-1">Disiplin süreçleri için belge oluşturun ve yönetin</p>
        </div>
      </div>

      {/* Ana İçerik */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Sol Panel - Seçimler */}
        <div className="lg:col-span-4 space-y-4">
          {/* Olay Bilgileri */}
          <Card className="bg-gradient-to-br from-rose-50 to-white border-rose-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-rose-800 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-rose-600" />
                Olay Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tarih Seçimi */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-rose-500" />
                  Olay Tarihi
                </Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-10 border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                />
              </div>

              {/* Sınıf Seçimi */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-rose-500" />
                  Sınıf / Şube
                </Label>
                <Select
                  disabled={loadingClasses}
                  value={selectedClass}
                  onValueChange={handleClassChange}
                >
                  <SelectTrigger className="h-10 border-rose-200 focus:border-rose-400">
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

              {/* Öğrenci Seçimi */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <User className="h-4 w-4 text-rose-500" />
                  Öğrenci
                </Label>
                <Select
                  disabled={!selectedClass || loadingStudents}
                  value={selectedStudent?.value || ""}
                  onValueChange={handleStudentChange}
                >
                  <SelectTrigger className="h-10 border-rose-200 focus:border-rose-400">
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

              {/* Yönlendirme Nedeni */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                  Olay Nedeni
                </Label>
                <Select
                  value={selectedReason}
                  onValueChange={setSelectedReason}
                >
                  <SelectTrigger className="h-10 border-rose-200 focus:border-rose-400">
                    <SelectValue placeholder="Neden seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {YONLENDIRME_NEDENLERI.map((neden) => (
                      <SelectItem key={neden} value={neden}>
                        {neden}
                      </SelectItem>
                    ))}
                    <SelectItem value="Diğer">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Verilen Ceza */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-500" />
                  Verilen Ceza
                </Label>
                <Select
                  value={selectedPenalty}
                  onValueChange={setSelectedPenalty}
                >
                  <SelectTrigger className="h-10 border-rose-200 focus:border-rose-400">
                    <SelectValue placeholder="Ceza türü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISIPLIN_CEZALARI.map((ceza) => (
                      <SelectItem key={ceza} value={ceza}>
                        {ceza}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Seçili Bilgiler */}
              {selectedStudent && (
                <div className="p-3 bg-rose-100 rounded-lg border border-rose-200">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-rose-600" />
                    <span className="text-sm font-medium text-rose-800">
                      {selectedStudent.text}
                    </span>
                  </div>
                  <p className="text-xs text-rose-600 mt-1">{selectedClassText}</p>
                  {selectedReason && (
                    <Badge className="mt-2 bg-rose-200 text-rose-700 border-rose-300">
                      {selectedReason}
                    </Badge>
                  )}
                  {selectedPenalty && (
                    <Badge className="mt-2 ml-1 bg-orange-200 text-orange-700 border-orange-300">
                      {selectedPenalty}
                    </Badge>
                  )}
                </div>
              )}

              {/* Cezayı Kaydet Butonu */}
              {selectedPenalty && (
                <Button
                  onClick={handleSavePenalty}
                  disabled={!canSavePenalty || savingPenalty}
                  className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white gap-2"
                >
                  {savingPenalty ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Cezayı Geçmişe Kaydet
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Toplantı Bilgileri (Çağrı ve Karar için) */}
          {(selectedDocument === "disiplin-cagri" || selectedDocument === "disiplin-karar") && (
            <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-amber-800 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  Toplantı Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Toplantı Tarihi</Label>
                  <Input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="h-10 border-amber-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Toplantı Saati</Label>
                  <Input
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="h-10 border-amber-200"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Belge Türleri */}
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-600" />
                Belge Türü
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {disiplinDocuments.map((doc) => {
                const Icon = doc.icon;
                const isSelected = selectedDocument === doc.id;
                const hasSaved = savedDocuments[doc.id] !== "";
                
                return (
                  <button
                    key={doc.id}
                    onClick={() => handleDocumentChange(doc.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left border ${
                      isSelected
                        ? doc.color + " border-current"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{doc.label}</span>
                        {hasSaved && !isSelected && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                            Kayıtlı
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{doc.description}</p>
                    </div>
                    {isSelected && <Check className="h-4 w-4 flex-shrink-0" />}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Ceza Belgeleri */}
          <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-orange-800 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-orange-600" />
                Ceza Belgeleri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {cezaDocuments.map((doc) => {
                const Icon = doc.icon;
                const isSelected = selectedDocument === doc.id;
                const hasSaved = savedDocuments[doc.id] !== "";
                
                return (
                  <button
                    key={doc.id}
                    onClick={() => handleDocumentChange(doc.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left border ${
                      isSelected
                        ? doc.color + " border-current"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{doc.label}</span>
                        {hasSaved && !isSelected && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                            Kayıtlı
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{doc.description}</p>
                    </div>
                    {isSelected && <Check className="h-4 w-4 flex-shrink-0" />}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Sağ Panel - Belge Editörü */}
        <div className="lg:col-span-8">
          <Card className="bg-white/80 backdrop-blur h-full">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  {(() => {
                    const doc = disiplinDocuments.find(d => d.id === selectedDocument) || cezaDocuments.find(d => d.id === selectedDocument);
                    const Icon = doc?.icon || FileText;
                    return <Icon className="h-5 w-5 text-rose-600" />;
                  })()}
                  {disiplinDocuments.find(d => d.id === selectedDocument)?.label || cezaDocuments.find(d => d.id === selectedDocument)?.label || "Belge"}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  {/* İşlem Butonları */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    onClick={handleSaveContent}
                    disabled={!documentContent}
                  >
                    <Save className="h-3.5 w-3.5" />
                    Kaydet
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50"
                    onClick={handleResetContent}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Sıfırla
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-slate-600 border-slate-200 hover:bg-slate-50"
                    onClick={handleClearContent}
                    disabled={!documentContent}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Temizle
                  </Button>
                  
                  <div className="w-px h-6 bg-slate-300 mx-1 hidden sm:block" />
                  
                  {/* Export Butonları */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    onClick={downloadAsWord}
                    disabled={exportingWord || !documentContent}
                  >
                    {exportingWord ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FileType className="h-3.5 w-3.5" />}
                    Word
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={downloadAsPdf}
                    disabled={exportingPdf || !documentContent}
                  >
                    {exportingPdf ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
                    PDF
                  </Button>
                  
                  <div className="w-px h-6 bg-slate-300 mx-1 hidden sm:block" />
                  
                  {/* Paylaşım Butonları */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50"
                    onClick={shareOnWhatsApp}
                    disabled={!documentContent}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-sky-600 border-sky-200 hover:bg-sky-50"
                    onClick={shareOnTelegram}
                    disabled={!documentContent}
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Telegram</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {/* Seçili öğrenci bilgisi */}
              {selectedStudent && (
                <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                    <User className="h-3 w-3 mr-1" />
                    {selectedStudent.text}
                  </Badge>
                  <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                    {selectedClassText}
                  </Badge>
                  {selectedReason && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {selectedReason}
                    </Badge>
                  )}
                  {selectedDate && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(selectedDate).toLocaleDateString('tr-TR')}
                    </Badge>
                  )}
                </div>
              )}

              {/* Uyarı - Seçim yapılmadıysa */}
              {!canProceed && (
                <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-700 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Belge oluşturmak için lütfen sınıf, öğrenci, tarih ve olay nedenini seçin.
                  </p>
                </div>
              )}

              {/* Zengin Metin Editörü */}
              <RichTextEditor
                content={documentContent}
                onChange={setDocumentContent}
                placeholder="Belge içeriği burada görünecek..."
              />

              {/* Bilgilendirme */}
              <div className="mt-4 p-3 bg-rose-50 rounded-lg border border-rose-200">
                <p className="text-xs text-rose-700 flex items-start gap-2">
                  <Gavel className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>İpucu:</strong> Tüm belgeleri sırayla doldurun. Her belge türü için içerik otomatik olarak kaydedilir. 
                    Belgelerinizi Word veya PDF olarak indirip resmi işlemlerinizde kullanabilirsiniz.
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
