"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  GraduationCap, 
  User, 
  RefreshCw,
  Send,
  FileType,
  FileDown,
  Mail,
  Phone,
  BookOpen,
  Building2,
  UserCircle,
  Check,
  Calendar,
  Clock,
  Save,
  RotateCcw,
  Trash2,
  Gavel,
  MessageCircle,
  Share2
} from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// RichTextEditor'u dinamik olarak yükle (SSR sorunlarını önlemek için)
const RichTextEditor = dynamic(
  () => import("@/components/RichTextEditor").then((mod) => mod.RichTextEditor),
  { 
    ssr: false,
    loading: () => (
      <div className="border border-slate-200 rounded-lg bg-white h-[500px] flex items-center justify-center text-slate-400">
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

type DocumentType = "veli-mektubu" | "veli-cagrisi" | "ogretmen-mektubu" | "ogretmen-tavsiyesi" | "idare-mektubu" | "disiplin-kurulu";

interface DocumentTemplate {
  id: DocumentType;
  label: string;
  icon: React.ElementType;
  color: string;
}

const documentTemplates: DocumentTemplate[] = [
  { id: "veli-mektubu", label: "Veli Mektubu", icon: Mail, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { id: "veli-cagrisi", label: "Veli Çağrısı", icon: Phone, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { id: "ogretmen-mektubu", label: "Öğretmen Mektubu", icon: BookOpen, color: "text-purple-600 bg-purple-50 border-purple-200" },
  { id: "ogretmen-tavsiyesi", label: "Öğretmen Tavsiyesi", icon: UserCircle, color: "text-amber-600 bg-amber-50 border-amber-200" },
  { id: "idare-mektubu", label: "İdare Mektubu", icon: Building2, color: "text-red-600 bg-red-50 border-red-200" },
  { id: "disiplin-kurulu", label: "Disiplin Kurulu Çağrısı", icon: Gavel, color: "text-rose-600 bg-rose-50 border-rose-200" },
];

export default function BelgePage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedClassText, setSelectedClassText] = useState<string>("");
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  // Belge state'leri
  const [selectedDocument, setSelectedDocument] = useState<DocumentType>("veli-mektubu");
  const [documentContent, setDocumentContent] = useState<string>("");
  const [exportingWord, setExportingWord] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  
  // Veli Çağrısı için tarih ve saat
  const [meetingDate, setMeetingDate] = useState<string>("");
  const [meetingTime, setMeetingTime] = useState<string>("");
  
  // Kaydedilen içerik
  const [savedContent, setSavedContent] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Tarih formatı
  const today = new Date();
  const formattedDate = today.toLocaleDateString('tr-TR', {
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
    toast.success(`${classText} sınıfı seçildi`);
  };

  // Öğrenci seçimi
  const handleStudentChange = (value: string) => {
    const student = students.find(s => s.value === value);
    if (student) {
      setSelectedStudent(student);
      toast.success(`${student.text} seçildi`);
      // Belge içeriğini güncelle
      updateDocumentContent(selectedDocument, student.text, selectedClassText, meetingDate, meetingTime);
    }
  };

  // Belge şablonlarını oluştur (HTML formatında TipTap için)
  const generateDocumentContent = (type: DocumentType, studentName: string, className: string, date?: string, time?: string): string => {
    const header = `<p style="text-align: center"><strong>T.C.</strong></p>
<p style="text-align: center"><strong>BİRECİK KAYMAKAMLIĞI</strong></p>
<p style="text-align: center"><strong>DUMLUPINAR İLKOKULU MÜDÜRLÜĞÜ</strong></p>
<p style="text-align: center"><strong>REHBERLİK SERVİSİ</strong></p>
<p></p>`;

    const signature = `<p></p>
<p>Saygılarımızla,</p>
<p></p>
<p>${formattedDate}</p>
<p></p>
<p style="text-align: right"><strong>MEHMET DALĞIN</strong></p>
<p style="text-align: right">Rehber Öğretmen ve Psikolojik Danışman</p>`;

    // Tarih ve saat formatla
    const formattedMeetingDate = date 
      ? new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
      : "____/____/________";
    const formattedMeetingTime = time || "____:____";

    const templates: Record<DocumentType, string> = {
      "veli-mektubu": `${header}
<p style="text-align: center"><strong>VELİ BİLGİLENDİRME MEKTUBU</strong></p>
<p></p>
<p>SAYIN VELİ,</p>
<p></p>
<p>Okulumuz ${className} sınıfı öğrencisi "<strong>${studentName}</strong>" ile ilgili olarak sizinle görüşme ihtiyacı doğmuştur.</p>
<p></p>
<p>Öğrencinizin okul sürecinde daha başarılı ve mutlu olabilmesi için veli-okul işbirliğinin önemli olduğuna inanmaktayız. Bu nedenle en kısa sürede okul rehberlik servisimizi ziyaret etmenizi rica ederiz.</p>
<p></p>
<p>Görüşme için uygun olduğunuz gün ve saati belirtmeniz halinde randevu ayarlamamız mümkün olacaktır.</p>
<p></p>
<p>Anlayışınız ve işbirliğiniz için teşekkür ederiz.</p>
${signature}`,

      "veli-cagrisi": `${header}
<p style="text-align: center"><strong>VELİ ÇAĞRI BELGESİ</strong></p>
<p></p>
<p>Tarih: ${formattedDate}</p>
<p></p>
<p>SAYIN VELİ,</p>
<p></p>
<p>Okulumuz ${className} sınıfı öğrencisi "<strong>${studentName}</strong>" velisi olarak aşağıda belirtilen tarih ve saatte okul rehberlik servisine gelmeniz gerekmektedir.</p>
<p></p>
<p><strong>Görüşme Konusu:</strong> Öğrenci takibi ve değerlendirme</p>
<p><strong>Görüşme Yeri:</strong> Okul Rehberlik Servisi</p>
<p><strong>Görüşme Tarihi:</strong> ${formattedMeetingDate}</p>
<p><strong>Görüşme Saati:</strong> ${formattedMeetingTime}</p>
<p></p>
<p>Bu görüşme öğrencinizin eğitim sürecinin daha verimli geçmesi için büyük önem taşımaktadır. Belirtilen tarihte gelememeniz durumunda lütfen önceden bilgi veriniz.</p>
<p></p>
<p>Katılımınız için teşekkür ederiz.</p>
${signature}`,

      "ogretmen-mektubu": `${header}
<p style="text-align: center"><strong>ÖĞRETMEN BİLGİ TALEBİ</strong></p>
<p></p>
<p>SAYIN ÖĞRETMEN,</p>
<p></p>
<p>${className} sınıfı öğrencisi "<strong>${studentName}</strong>" hakkında sizden bilgi ve değerlendirme talep etmekteyiz.</p>
<p></p>
<p>Öğrencinin;</p>
<ul>
<li>Ders içi performansı ve katılımı</li>
<li>Sınıf içi davranışları</li>
<li>Akran ilişkileri</li>
<li>Dikkat çeken olumlu/olumsuz durumlar</li>
</ul>
<p></p>
<p>konularında görüşlerinizi paylaşmanızı rica ederiz.</p>
<p></p>
<p>Öğrenciye yönelik ortak bir çalışma planı oluşturabilmemiz için görüşleriniz büyük önem taşımaktadır.</p>
<p></p>
<p>İşbirliğiniz için teşekkür ederiz.</p>
${signature}`,

      "ogretmen-tavsiyesi": `${header}
<p style="text-align: center"><strong>ÖĞRETMEN TAVSİYE FORMU</strong></p>
<p></p>
<p><strong>Tarih:</strong> ${formattedDate}</p>
<p><strong>Öğrenci:</strong> ${studentName}</p>
<p><strong>Sınıf:</strong> ${className}</p>
<p></p>
<p>SAYIN ÖĞRETMEN,</p>
<p></p>
<p>Aşağıda bilgileri verilen öğrenci için önerilerinizi ve tavsiyelerinizi paylaşmanızı rica ederiz.</p>
<p></p>
<p><strong>AKADEMİK DURUM:</strong></p>
<p>☐ Çok Başarılı&nbsp;&nbsp;&nbsp;&nbsp;☐ Başarılı&nbsp;&nbsp;&nbsp;&nbsp;☐ Orta&nbsp;&nbsp;&nbsp;&nbsp;☐ Geliştirilmeli</p>
<p></p>
<p><strong>DAVRANIŞ DURUMU:</strong></p>
<p>☐ Çok İyi&nbsp;&nbsp;&nbsp;&nbsp;☐ İyi&nbsp;&nbsp;&nbsp;&nbsp;☐ Orta&nbsp;&nbsp;&nbsp;&nbsp;☐ Geliştirilmeli</p>
<p></p>
<p><strong>KATILIM:</strong></p>
<p>☐ Aktif&nbsp;&nbsp;&nbsp;&nbsp;☐ Normal&nbsp;&nbsp;&nbsp;&nbsp;☐ Pasif</p>
<p></p>
<p><strong>ÖNERİLERİNİZ:</strong></p>
<p>________________________________________________________________________</p>
<p>________________________________________________________________________</p>
<p>________________________________________________________________________</p>
<p></p>
<p>Formu doldurduğunuz için teşekkür ederiz.</p>
${signature}`,

      "idare-mektubu": `${header}
<p style="text-align: center"><strong>İDARE BİLGİLENDİRME YAZISI</strong></p>
<p></p>
<p><strong>Tarih:</strong> ${formattedDate}</p>
<p><strong>Konu:</strong> Öğrenci Hakkında Bilgilendirme</p>
<p></p>
<p>SAYIN MÜDÜRÜM,</p>
<p></p>
<p>${className} sınıfı öğrencisi "<strong>${studentName}</strong>" hakkında aşağıdaki hususları bilgilerinize sunmak istiyorum.</p>
<p></p>
<p><strong>DURUM DEĞERLENDİRMESİ:</strong></p>
<p>Öğrencinin mevcut durumu ve izleme süreci hakkında bilgi vermek amacıyla bu yazı hazırlanmıştır.</p>
<p></p>
<p><strong>YAPILAN ÇALIŞMALAR:</strong></p>
<ul>
<li>Bireysel görüşmeler yapılmıştır</li>
<li>Veli ile iletişime geçilmiştir</li>
<li>Sınıf öğretmenleri ile koordinasyon sağlanmıştır</li>
</ul>
<p></p>
<p><strong>ÖNERİLER:</strong></p>
<p>Öğrencinin eğitim sürecinin daha verimli geçmesi için aşağıdaki öneriler sunulmaktadır:</p>
<ol>
<li>________________________________________________________________</li>
<li>________________________________________________________________</li>
<li>________________________________________________________________</li>
</ol>
<p></p>
<p>Bilgilerinize arz ederim.</p>
${signature}`,

      "disiplin-kurulu": `${header}
<p style="text-align: center"><strong>DİSİPLİN KURULU TOPLANTI ÇAĞRISI</strong></p>
<p></p>
<p><strong>Tarih:</strong> ${formattedDate}</p>
<p><strong>Sayı:</strong> ____________________</p>
<p><strong>Konu:</strong> Disiplin Kurulu Toplantısına Çağrı</p>
<p></p>
<p>SAYIN VELİ,</p>
<p></p>
<p>Okulumuz ${className} sınıfı öğrencisi "<strong>${studentName}</strong>" hakkında açılan disiplin soruşturması kapsamında, öğrenci velisi olarak aşağıda belirtilen tarih ve saatte okulumuz Disiplin Kurulu toplantısına katılmanız gerekmektedir.</p>
<p></p>
<p><strong>Toplantı Tarihi:</strong> ${formattedMeetingDate}</p>
<p><strong>Toplantı Saati:</strong> ${formattedMeetingTime}</p>
<p><strong>Toplantı Yeri:</strong> Okul Müdürlüğü / Toplantı Salonu</p>
<p></p>
<p><strong>Soruşturma Konusu:</strong></p>
<p>________________________________________________________________________</p>
<p>________________________________________________________________________</p>
<p></p>
<p><strong>ÖNEMLİ NOTLAR:</strong></p>
<ul>
<li>Toplantıya kimlik belgenizle birlikte gelmeniz gerekmektedir.</li>
<li>Toplantıda öğrencinizin savunmasını yapma hakkınız bulunmaktadır.</li>
<li>Belirtilen tarihte gelememeniz durumunda yazılı mazeret bildirmeniz gerekmektedir.</li>
<li>Mazeretsiz katılım sağlanmaması halinde işlemler giyabınızda yapılacaktır.</li>
</ul>
<p></p>
<p>Bilgilerinize önemle rica ederim.</p>
${signature}`,
    };

    return templates[type] || "";
  };

  // Belge içeriğini güncelle
  const updateDocumentContent = (type: DocumentType, studentName?: string, className?: string, date?: string, time?: string) => {
    const name = studentName || selectedStudent?.text || "[Öğrenci Seçilmedi]";
    const cls = className || selectedClassText || "[Sınıf Seçilmedi]";
    const meetingDateVal = date !== undefined ? date : meetingDate;
    const meetingTimeVal = time !== undefined ? time : meetingTime;
    const content = generateDocumentContent(type, name, cls, meetingDateVal, meetingTimeVal);
    setDocumentContent(content);
  };

  // Tarih değiştiğinde
  const handleMeetingDateChange = (date: string) => {
    setMeetingDate(date);
    if (selectedDocument === "veli-cagrisi" || selectedDocument === "disiplin-kurulu") {
      updateDocumentContent(selectedDocument, undefined, undefined, date, meetingTime);
    }
    const formattedDate = new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    toast.success(`Görüşme tarihi: ${formattedDate}`);
  };

  // Saat değiştiğinde
  const handleMeetingTimeChange = (time: string) => {
    setMeetingTime(time);
    if (selectedDocument === "veli-cagrisi" || selectedDocument === "disiplin-kurulu") {
      updateDocumentContent(selectedDocument, undefined, undefined, meetingDate, time);
    }
    toast.success(`Görüşme saati: ${time}`);
  };

  // Belge tipi değiştiğinde
  const handleDocumentChange = (type: DocumentType) => {
    setSelectedDocument(type);
    updateDocumentContent(type, undefined, undefined, meetingDate, meetingTime);
    const templateName = documentTemplates.find(t => t.id === type)?.label || type;
    toast.success(`${templateName} şablonu oluşturuldu`);
  };

  // İçeriği kaydet
  const handleSaveContent = () => {
    setSavedContent(documentContent);
    setHasUnsavedChanges(false);
    toast.success("Belge içeriği kaydedildi!");
  };

  // Şablona sıfırla
  const handleResetContent = () => {
    updateDocumentContent(selectedDocument, undefined, undefined, meetingDate, meetingTime);
    setHasUnsavedChanges(false);
    toast.info("Belge şablona sıfırlandı");
  };

  // İçeriği temizle
  const handleClearContent = () => {
    setDocumentContent("");
    setHasUnsavedChanges(true);
    toast.info("Belge içeriği temizlendi");
  };

  // İçerik değiştiğinde unsaved flag'i güncelle
  const handleContentChange = (content: string) => {
    setDocumentContent(content);
    setHasUnsavedChanges(savedContent !== content);
  };

  // HTML'den düz metin çıkar (WhatsApp/Telegram için)
  const htmlToPlainText = (html: string): string => {
    // HTML etiketlerini temizle
    let text = html
      .replace(/<p><\/p>/g, '\n') // Boş paragraflar
      .replace(/<p[^>]*>/g, '') // Açılış p etiketi
      .replace(/<\/p>/g, '\n') // Kapanış p etiketi
      .replace(/<br\s*\/?>/g, '\n') // br etiketleri
      .replace(/<li>/g, '\u2022 ') // Liste öğeleri
      .replace(/<\/li>/g, '\n')
      .replace(/<ul>|<\/ul>|<ol>|<\/ol>/g, '') // Liste etiketleri
      .replace(/<strong>|<\/strong>|<b>|<\/b>/g, '*') // Kalın
      .replace(/<em>|<\/em>|<i>|<\/i>/g, '_') // İtalik
      .replace(/<[^>]+>/g, '') // Diğer tüm HTML etiketleri
      .replace(/&nbsp;/g, ' ') // Non-breaking space
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n{3,}/g, '\n\n') // Çoklu boş satırları azalt
      .trim();
    return text;
  };

  // WhatsApp'ta paylaş
  const shareOnWhatsApp = () => {
    if (!documentContent) return;
    
    const plainText = htmlToPlainText(documentContent);
    const encodedText = encodeURIComponent(plainText);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success("WhatsApp açılıyor...");
  };

  // Telegram'da paylaş
  const shareOnTelegram = () => {
    if (!documentContent) return;
    
    const plainText = htmlToPlainText(documentContent);
    const encodedText = encodeURIComponent(plainText);
    const telegramUrl = `https://t.me/share/url?text=${encodedText}`;
    
    window.open(telegramUrl, '_blank');
    toast.success("Telegram açılıyor...");
  };

  // Word olarak indir
  const downloadAsWord = () => {
    if (!documentContent) return;
    
    setExportingWord(true);
    
    try {
      const selectedTemplate = documentTemplates.find(t => t.id === selectedDocument);
      const fileName = `${selectedTemplate?.label || 'Belge'}_${selectedStudent?.text || 'Öğrenci'}.doc`.replace(/\s+/g, '_');
      
      // Boş paragrafları görünür yap (non-breaking space ekle)
      const processedContent = documentContent
        .replace(/<p><\/p>/g, '<p>&nbsp;</p>')
        .replace(/<p>\s*<br\s*\/?>\s*<\/p>/g, '<p>&nbsp;</p>');
      
      // TipTap HTML içeriğini direkt kullan (zaten HTML formatında)
      const htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>${selectedTemplate?.label}</title>
          <style>
            body { 
              font-family: 'Times New Roman', Times, serif; 
              font-size: 12pt; 
              line-height: 1.8; 
              padding: 40px; 
            }
            p { 
              margin: 0; 
              padding: 0;
              min-height: 1.2em;
            }
            p:empty::before {
              content: "\\00a0";
            }
            h1 { font-size: 18pt; font-weight: bold; margin: 0.5em 0; }
            h2 { font-size: 16pt; font-weight: bold; margin: 0.5em 0; }
            h3 { font-size: 14pt; font-weight: bold; margin: 0.5em 0; }
            strong, b { font-weight: bold; }
            em, i { font-style: italic; }
            u { text-decoration: underline; }
            s { text-decoration: line-through; }
            mark { background-color: #fef08a; }
            blockquote { border-left: 3px solid #ccc; margin-left: 0; padding-left: 1em; color: #666; }
            ul, ol { margin: 0.5em 0; padding-left: 1.5em; }
            hr { border: none; border-top: 1px solid #ccc; margin: 1em 0; }
          </style>
        </head>
        <body>
          ${processedContent}
        </body>
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
      console.error("Word export error:", error);
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
      const selectedTemplate = documentTemplates.find(t => t.id === selectedDocument);
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error("Pop-up engelleyici aktif olabilir");
        setExportingPdf(false);
        return;
      }
      
      // Boş paragrafları görünür yap (non-breaking space ekle)
      const processedContent = documentContent
        .replace(/<p><\/p>/g, '<p>&nbsp;</p>')
        .replace(/<p>\s*<br\s*\/?>\s*<\/p>/g, '<p>&nbsp;</p>');
      
      // TipTap HTML içeriğini direkt kullan
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${selectedTemplate?.label} - ${selectedStudent?.text || 'Öğrenci'}</title>
          <style>
            body { 
              font-family: 'Times New Roman', Times, serif; 
              font-size: 12pt; 
              line-height: 1.8; 
              padding: 40px;
              color: #333;
            }
            p { 
              margin: 0; 
              padding: 0;
              min-height: 1.2em;
            }
            p:empty::before {
              content: "\\00a0";
            }
            h1 { font-size: 18pt; font-weight: bold; margin: 0.5em 0; }
            h2 { font-size: 16pt; font-weight: bold; margin: 0.5em 0; }
            h3 { font-size: 14pt; font-weight: bold; margin: 0.5em 0; }
            strong, b { font-weight: bold; }
            em, i { font-style: italic; }
            u { text-decoration: underline; }
            s { text-decoration: line-through; }
            mark { background-color: #fef08a; padding: 0 2px; }
            blockquote { 
              border-left: 3px solid #ccc; 
              margin: 0.5em 0; 
              padding-left: 1em; 
              color: #666; 
            }
            ul, ol { margin: 0.5em 0; padding-left: 1.5em; }
            hr { border: none; border-top: 1px solid #ccc; margin: 1em 0; }
            @media print { 
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          ${processedContent}
        </body>
        </html>
      `;
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        toast.success("PDF olarak kaydetmek için 'PDF olarak kaydet' seçin");
      }, 500);
      
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("PDF dosyası oluşturulamadı");
    } finally {
      setExportingPdf(false);
    }
  };

  // İlk yüklemede varsayılan içerik
  useEffect(() => {
    if (!documentContent) {
      updateDocumentContent(selectedDocument);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Belge Oluştur</h1>
          <p className="text-sm text-slate-500">Öğrenci seçin ve belge şablonu oluşturun</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sol Panel - Öğrenci Seçimi */}
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

          {/* Öğrenci Seçimi */}
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-600" />
                Öğrenci
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                disabled={!selectedClass || loadingStudents}
                value={selectedStudent?.value || ""}
                onValueChange={handleStudentChange}
              >
                <SelectTrigger className="h-10">
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

              {selectedStudent && (
                <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800">
                      {selectedStudent.text}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-600 mt-1">{selectedClassText}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Belge Türleri */}
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Belge Türü
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {documentTemplates.map((template) => {
                const Icon = template.icon;
                const isSelected = selectedDocument === template.id;
                
                return (
                  <button
                    key={template.id}
                    onClick={() => handleDocumentChange(template.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left border ${
                      isSelected
                        ? template.color + " border-current"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {template.label}
                    {isSelected && <Check className="h-4 w-4 ml-auto" />}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Veli Çağrısı veya Disiplin Kurulu için Tarih ve Saat Seçimi */}
          {(selectedDocument === "veli-cagrisi" || selectedDocument === "disiplin-kurulu") && (
            <Card className={`bg-white/80 backdrop-blur ${selectedDocument === "disiplin-kurulu" ? "border-rose-200" : "border-emerald-200"}`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-base font-semibold flex items-center gap-2 ${selectedDocument === "disiplin-kurulu" ? "text-rose-800" : "text-emerald-800"}`}>
                  <Calendar className={`h-5 w-5 ${selectedDocument === "disiplin-kurulu" ? "text-rose-600" : "text-emerald-600"}`} />
                  {selectedDocument === "disiplin-kurulu" ? "Toplantı Zamanı" : "Görüşme Zamanı"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meetingDate" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Calendar className={`h-4 w-4 ${selectedDocument === "disiplin-kurulu" ? "text-rose-500" : "text-emerald-500"}`} />
                    {selectedDocument === "disiplin-kurulu" ? "Toplantı Tarihi" : "Görüşme Tarihi"}
                  </Label>
                  <Input
                    id="meetingDate"
                    type="date"
                    value={meetingDate}
                    onChange={(e) => handleMeetingDateChange(e.target.value)}
                    className={`h-10 ${selectedDocument === "disiplin-kurulu" ? "border-rose-200 focus:border-rose-400 focus:ring-rose-400" : "border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meetingTime" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Clock className={`h-4 w-4 ${selectedDocument === "disiplin-kurulu" ? "text-rose-500" : "text-emerald-500"}`} />
                    {selectedDocument === "disiplin-kurulu" ? "Toplantı Saati" : "Görüşme Saati"}
                  </Label>
                  <Input
                    id="meetingTime"
                    type="time"
                    value={meetingTime}
                    onChange={(e) => handleMeetingTimeChange(e.target.value)}
                    className={`h-10 ${selectedDocument === "disiplin-kurulu" ? "border-rose-200 focus:border-rose-400 focus:ring-rose-400" : "border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"}`}
                  />
                </div>
                {(meetingDate || meetingTime) && (
                  <div className={`p-3 rounded-lg border ${selectedDocument === "disiplin-kurulu" ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200"}`}>
                    <p className={`text-xs font-medium ${selectedDocument === "disiplin-kurulu" ? "text-rose-700" : "text-emerald-700"}`}>
                      Seçilen Zaman:
                    </p>
                    <p className={`text-sm mt-1 ${selectedDocument === "disiplin-kurulu" ? "text-rose-800" : "text-emerald-800"}`}>
                      {meetingDate 
                        ? new Date(meetingDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })
                        : "Tarih seçilmedi"
                      }
                      {meetingTime && ` - Saat ${meetingTime}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sağ Panel - Belge Önizleme ve Düzenleme */}
        <div className="lg:col-span-2">
          <Card className="bg-white/80 backdrop-blur h-full">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  {documentTemplates.find(t => t.id === selectedDocument)?.label || "Belge"} Önizleme
                  {hasUnsavedChanges && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-xs">
                      Kaydedilmemiş
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Kaydet, Sıfırla, Temizle Butonları */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    onClick={handleSaveContent}
                    disabled={!documentContent}
                    title="İçeriği kaydet"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Kaydet
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50"
                    onClick={handleResetContent}
                    title="Şablona sıfırla"
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
                    title="İçeriği temizle"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Temizle
                  </Button>
                  
                  <div className="w-px h-6 bg-slate-300 mx-1" />
                  
                  {/* Word ve PDF İndirme */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    onClick={downloadAsWord}
                    disabled={exportingWord || !documentContent}
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
                    disabled={exportingPdf || !documentContent}
                  >
                    {exportingPdf ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <FileDown className="h-3.5 w-3.5" />
                    )}
                    PDF
                  </Button>
                  
                  <div className="w-px h-6 bg-slate-300 mx-1" />
                  
                  {/* WhatsApp ve Telegram Paylaşım */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50"
                    onClick={shareOnWhatsApp}
                    disabled={!documentContent}
                    title="WhatsApp'ta paylaş"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-sky-600 border-sky-200 hover:bg-sky-50"
                    onClick={shareOnTelegram}
                    disabled={!documentContent}
                    title="Telegram'da paylaş"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Telegram
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {/* Seçili öğrenci bilgisi */}
              {selectedStudent && (
                <div className="mb-4 flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <User className="h-3 w-3 mr-1" />
                    {selectedStudent.text}
                  </Badge>
                  <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                    {selectedClassText}
                  </Badge>
                </div>
              )}

              {/* Zengin Metin Editörü */}
              <RichTextEditor
                content={documentContent}
                onChange={handleContentChange}
                placeholder="Önce öğrenci seçin..."
              />

              {/* Bilgilendirme */}
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-700 flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Belge içeriğini editörde düzenleyebilirsiniz. <strong>Kalın</strong>, <em>italik</em>, altı çizili, hizalama ve daha fazla özellik kullanabilirsiniz.
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
