"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import DOMPurify from "isomorphic-dompurify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Printer,
  Calendar,
  Clock,
  Users,
  Bus,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileCheck,
  ScrollText,
  UserCheck,
  Route,
  Eye,
  ArrowLeft,
  Sparkles,
  Save,
  Navigation
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  type OkulDisiEtkinlik,
  type SchoolSettings,
  type StudentItem,
  generateVeliIzinDilekcesi,
  generateAracSozlesmesi,
  generateSorumluOgretmenler,
  generateKatilimciListesi,
  generateOkulIzinDilekcesi,
  generateGeziPlani,
  getResmiCss,
} from "./documents";

// ==================== EVRAK TİPLERİ ====================
const DOCUMENT_TYPES = [
  { id: "veli-izin", label: "Veli İzin Dilekçesi", description: "Her öğrenci için ayrı izin belgesi", icon: FileText, color: "blue", gradient: "from-blue-500 to-indigo-600" },
  { id: "arac-sozlesmesi", label: "Araç Kiralama Sözleşmesi", description: "16 maddelik resmi sözleşme", icon: Bus, color: "amber", gradient: "from-amber-500 to-orange-600" },
  { id: "sorumlu-ogretmenler", label: "Sorumlu Öğretmenler", description: "Öğretmen ve araç firma bilgileri", icon: UserCheck, color: "emerald", gradient: "from-emerald-500 to-teal-600" },
  { id: "katilimci-listesi", label: "Katılımcı Listesi", description: "Öğrenci isimli katılımcı tablosu", icon: ClipboardList, color: "purple", gradient: "from-purple-500 to-violet-600" },
  { id: "okul-izin", label: "Okul İzin Dilekçesi (EK-5)", description: "Müdürlüğe hitaben izin yazısı", icon: FileCheck, color: "indigo", gradient: "from-indigo-500 to-blue-600" },
  { id: "gezi-plani", label: "Gezi Planı (EK-6)", description: "Detaylı etkinlik planı formu", icon: ScrollText, color: "teal", gradient: "from-teal-500 to-cyan-600" },
];

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; ring: string; light: string }> = {
  blue:    { bg: "bg-blue-500",    text: "text-blue-600",    border: "border-blue-200",    ring: "ring-blue-400",    light: "bg-blue-50" },
  amber:   { bg: "bg-amber-500",   text: "text-amber-600",   border: "border-amber-200",   ring: "ring-amber-400",   light: "bg-amber-50" },
  emerald: { bg: "bg-emerald-500", text: "text-emerald-600", border: "border-emerald-200", ring: "ring-emerald-400", light: "bg-emerald-50" },
  purple:  { bg: "bg-purple-500",  text: "text-purple-600",  border: "border-purple-200",  ring: "ring-purple-400",  light: "bg-purple-50" },
  indigo:  { bg: "bg-indigo-500",  text: "text-indigo-600",  border: "border-indigo-200",  ring: "ring-indigo-400",  light: "bg-indigo-50" },
  teal:    { bg: "bg-teal-500",    text: "text-teal-600",    border: "border-teal-200",    ring: "ring-teal-400",    light: "bg-teal-50" },
};

const DEFAULT_SETTINGS: SchoolSettings = {
  school_name: "DUMLUPINAR İLKOKULU",
  school_principal: "",
  school_address: "",
  counselor_name: "",
  academic_year: "2025-2026",
};

const EMPTY_FORM = {
  etkinlik_adi: "",
  etkinlik_tarihi: new Date().toISOString().split("T")[0],
  mekan: "",
  guzergah: "",
  cikis_saati: "",
  donus_saati: "",
  sure: "",
  ogretmen_adi: "",
  sinif_key: "",
  sinif_display: "",
  refakatci: "",
  arac_plaka: "",
  arac_sofor: "",
  arac_firma: "",
  arac_telefon: "",
  katilimci_sayisi: 0,
  aciklama: "",
};

// Animasyon varyantları
const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.07 } } };
const cardHover = { scale: 1.02, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" };

export default function OkulDisiEtkinlikPage() {
  // State
  const [activities, setActivities] = useState<OkulDisiEtkinlik[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Belge sekmesi state
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("etkinlikler");

  // Belge editörü state
  const [editorHtml, setEditorHtml] = useState<string>("");
  const [editorTitle, setEditorTitle] = useState<string>("");
  const [showEditor, setShowEditor] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Dış veri
  const [teachers, setTeachers] = useState<{ value: string; label: string; sinifSubeKey: string; sinifSubeDisplay: string }[]>([]);
  const [classes, setClasses] = useState<{ value: string; text: string }[]>([]);
  const [settings, setSettings] = useState<SchoolSettings>(DEFAULT_SETTINGS);

  // ==================== VERİ YÜKLEME ====================
  useEffect(() => {
    loadActivities();
    loadTeachersAndClasses();
    loadSettings();
  }, []);

  const loadActivities = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("okul_disi_etkinlikler")
        .select("*")
        .order("etkinlik_tarihi", { ascending: false });
      if (error) throw error;
      setActivities((data as OkulDisiEtkinlik[]) || []);
    } catch (error) {
      console.error("Etkinlikler yüklenemedi:", error);
      toast.error("Etkinlikler yüklenirken hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeachersAndClasses = async () => {
    try {
      const [tRes, cRes] = await Promise.all([fetch("/api/teachers"), fetch("/api/data")]);
      if (tRes.ok) {
        const tJson = await tRes.json();
        setTeachers(
          (tJson.teachers || []).map((t: { value: string; label: string; sinifSubeKey: string; sinifSubeDisplay: string }) => ({
            value: t.value, label: t.label, sinifSubeKey: t.sinifSubeKey, sinifSubeDisplay: t.sinifSubeDisplay,
          }))
        );
      }
      if (cRes.ok) {
        const cJson = await cRes.json();
        setClasses(cJson.sinifSubeList || []);
      }
    } catch (error) {
      console.error("Öğretmen/sınıf verisi yüklenemedi:", error);
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.from("settings").select("*");
      if (error) throw error;
      if (data && data.length > 0) {
        const loaded = { ...DEFAULT_SETTINGS };
        data.forEach((s: { setting_key: string; setting_value: unknown }) => {
          const key = s.setting_key as keyof SchoolSettings;
          if (key in loaded) {
            try { loaded[key] = typeof s.setting_value === "string" ? JSON.parse(s.setting_value) : String(s.setting_value); }
            catch { loaded[key] = String(s.setting_value); }
          }
        });
        setSettings(loaded);
      }
    } catch (error) {
      console.error("Ayarlar yüklenemedi:", error);
    }
  };

  // ==================== CRUD ====================
  const handleSave = async () => {
    if (!formData.etkinlik_adi.trim()) { toast.error("Etkinlik adı gerekli"); return; }
    if (!formData.mekan.trim()) { toast.error("Mekan gerekli"); return; }
    if (!formData.ogretmen_adi) { toast.error("Öğretmen seçin"); return; }
    if (!formData.sinif_display) { toast.error("Sınıf seçin"); return; }

    const saveData = { ...formData, katilimci_sayisi: Number(formData.katilimci_sayisi) || 0 };

    try {
      if (editingId) {
        const { error } = await supabase.from("okul_disi_etkinlikler").update({ ...saveData, updated_at: new Date().toISOString() }).eq("id", editingId);
        if (error) throw error;
        toast.success("Etkinlik güncellendi");
      } else {
        const { error } = await supabase.from("okul_disi_etkinlikler").insert(saveData);
        if (error) throw error;
        toast.success("Etkinlik oluşturuldu");
      }
      resetForm();
      loadActivities();
    } catch (error) {
      console.error("Kaydetme hatası:", error);
      toast.error("Kaydetme sırasında hata oluştu");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu etkinliği silmek istediğinize emin misiniz?")) return;
    try {
      const { error } = await supabase.from("okul_disi_etkinlikler").delete().eq("id", id);
      if (error) throw error;
      toast.success("Etkinlik silindi");
      loadActivities();
    } catch (error) {
      console.error("Silme hatası:", error);
      toast.error("Silme sırasında hata oluştu");
    }
  };

  const handleEdit = (a: OkulDisiEtkinlik) => {
    setEditingId(a.id);
    setFormData({
      etkinlik_adi: a.etkinlik_adi, etkinlik_tarihi: a.etkinlik_tarihi, mekan: a.mekan,
      guzergah: a.guzergah || "", cikis_saati: a.cikis_saati || "", donus_saati: a.donus_saati || "",
      sure: a.sure || "", ogretmen_adi: a.ogretmen_adi, sinif_key: a.sinif_key,
      sinif_display: a.sinif_display, refakatci: a.refakatci || "",
      arac_plaka: a.arac_plaka || "", arac_sofor: a.arac_sofor || "",
      arac_firma: a.arac_firma || "", arac_telefon: a.arac_telefon || "",
      katilimci_sayisi: a.katilimci_sayisi || 0, aciklama: a.aciklama || "",
    });
    setShowForm(true);
    setActiveTab("etkinlikler");
  };

  const resetForm = () => { setShowForm(false); setEditingId(null); setFormData(EMPTY_FORM); };

  // ==================== BELGE ÜRETİMİ & EDİTÖR ====================
  const fetchStudents = async (sinifKey: string): Promise<StudentItem[]> => {
    try {
      const res = await fetch(`/api/students?sinifSube=${encodeURIComponent(sinifKey)}`);
      if (!res.ok) return [];
      return await res.json();
    } catch { return []; }
  };

  const handleGenerateDocument = async (docType: string) => {
    const activity = activities.find((a) => a.id === selectedActivityId);
    if (!activity) { toast.error("Lütfen bir etkinlik seçin"); return; }

    setIsGenerating(true);
    let students: StudentItem[] = [];
    if (docType === "veli-izin" || docType === "katilimci-listesi") {
      students = await fetchStudents(activity.sinif_key);
      if (students.length === 0) toast.warning("Bu sınıfta öğrenci bulunamadı, boş form oluşturulacak");
    }

    const docLabel = DOCUMENT_TYPES.find((d) => d.id === docType)?.label || docType;
    let html = "";
    switch (docType) {
      case "veli-izin": html = generateVeliIzinDilekcesi(activity, settings, students); break;
      case "katilimci-listesi": html = generateKatilimciListesi(activity, settings, students); break;
      case "arac-sozlesmesi": html = generateAracSozlesmesi(activity, settings); break;
      case "sorumlu-ogretmenler": html = generateSorumluOgretmenler(activity, settings); break;
      case "okul-izin": html = generateOkulIzinDilekcesi(activity, settings); break;
      case "gezi-plani": html = generateGeziPlani(activity, settings); break;
      default: setIsGenerating(false); return;
    }

    setEditorHtml(DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["p", "strong", "em", "u", "b", "i", "br", "div", "span", "table", "tr", "td", "th", "thead", "tbody", "ul", "ol", "li", "h1", "h2", "h3", "h4", "hr", "img", "sup", "sub"],
      ALLOWED_ATTR: ["style", "class", "colspan", "rowspan", "src", "alt", "width", "height"],
    }));
    setEditorTitle(`${docLabel} — ${activity.etkinlik_adi}`);
    setShowEditor(true);
    setIsGenerating(false);
    toast.success("Belge oluşturuldu! Düzenleyip yazdırabilirsiniz.");
  };

  const printFromEditor = () => {
    const content = editorRef.current?.innerHTML || editorHtml;
    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Pop-up engelleyici aktif olabilir"); return; }
    printWindow.document.write(DOMPurify.sanitize(`<!DOCTYPE html><html><head>
      <meta charset="utf-8"><title>${editorTitle}</title>
      <style>${getResmiCss()}</style>
    </head><body class="sayfa">${content}</body></html>`));
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  // ==================== FİLTRE & YARDIMCI ====================
  const filteredActivities = useMemo(() => {
    if (!searchQuery.trim()) return activities;
    const q = searchQuery.toLowerCase();
    return activities.filter((a) =>
      a.etkinlik_adi.toLowerCase().includes(q) || a.mekan.toLowerCase().includes(q) ||
      a.ogretmen_adi.toLowerCase().includes(q) || a.sinif_display.toLowerCase().includes(q)
    );
  }, [activities, searchQuery]);

  const selectedActivity = activities.find((a) => a.id === selectedActivityId);

  const handleTeacherChange = (value: string) => {
    const teacher = teachers.find((t) => t.value === value);
    if (teacher) setFormData({ ...formData, ogretmen_adi: value, sinif_key: teacher.sinifSubeKey, sinif_display: teacher.sinifSubeDisplay });
    else setFormData({ ...formData, ogretmen_adi: value });
  };

  const handleClassChange = (value: string) => {
    const cls = classes.find((c) => c.value === value);
    const matchingTeacher = teachers.find((t) => t.sinifSubeKey === value);
    setFormData({
      ...formData, sinif_key: value, sinif_display: cls?.text || value,
      ...(matchingTeacher ? { ogretmen_adi: matchingTeacher.value } : {}),
    });
  };

  // ==================== RENDER ====================
  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6bTAtMzBWMkgydjJoMzR6TTIgMjB2MmgzNHYtMkgyek0yIDh2MmgzNFY4SDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Navigation className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Okul Dışı Etkinlikler</h1>
                <p className="text-emerald-100 text-sm md:text-base">Gezi & etkinlik yönetimi, evrak oluşturma</p>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{activities.length}</p>
              <p className="text-xs text-emerald-100">Etkinlik</p>
            </div>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setShowEditor(false); }}>
        <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-slate-100 p-1">
          <TabsTrigger value="etkinlikler" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md text-sm font-medium transition-all">
            <MapPin className="h-4 w-4 mr-2" /> Etkinlik Yönetimi
          </TabsTrigger>
          <TabsTrigger value="belgeler" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md text-sm font-medium transition-all">
            <FileText className="h-4 w-4 mr-2" /> Belge Oluştur
          </TabsTrigger>
        </TabsList>

        {/* ==================== SEKME 1: ETKİNLİK YÖNETİMİ ==================== */}
        <TabsContent value="etkinlikler" className="space-y-4 mt-4">
          {/* Toolbar */}
          <motion.div initial={fadeIn.hidden} animate={fadeIn.visible} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Etkinlik, mekan, öğretmen ara..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11 rounded-xl border-slate-200 focus:ring-emerald-400" />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button onClick={() => { resetForm(); setShowForm(true); }}
              className="h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-200 rounded-xl">
              <Plus className="h-4 w-4 mr-2" /> Yeni Etkinlik
            </Button>
            <Button variant="outline" onClick={loadActivities} disabled={isLoading} className="h-11 rounded-xl">
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </motion.div>

          {/* Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                <Card className="border-0 shadow-xl shadow-emerald-100 overflow-hidden rounded-2xl">
                  <CardHeader className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white py-5 px-6">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      {editingId ? "Etkinlik Düzenle" : "Yeni Etkinlik Oluştur"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    {/* Satır 1: Ad + Tarih */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-700">Etkinlik Adı *</Label>
                        <Input value={formData.etkinlik_adi} onChange={(e) => setFormData({ ...formData, etkinlik_adi: e.target.value })}
                          placeholder="Örn: İtfaiye Ziyareti" className="h-11 rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-700">Tarih *</Label>
                        <Input type="date" value={formData.etkinlik_tarihi}
                          onChange={(e) => setFormData({ ...formData, etkinlik_tarihi: e.target.value })} className="h-11 rounded-xl" />
                      </div>
                    </div>

                    {/* Satır 2: Mekan + Güzergah */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-700">Mekan *</Label>
                        <Input value={formData.mekan} onChange={(e) => setFormData({ ...formData, mekan: e.target.value })}
                          placeholder="Örn: İlçe İtfaiye Müdürlüğü" className="h-11 rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-700">Güzergah</Label>
                        <Input value={formData.guzergah} onChange={(e) => setFormData({ ...formData, guzergah: e.target.value })}
                          placeholder="Örn: Okul - İtfaiye - Okul" className="h-11 rounded-xl" />
                      </div>
                    </div>

                    {/* Satır 3: Öğretmen + Sınıf */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-700">Öğretmen *</Label>
                        <Select value={formData.ogretmen_adi} onValueChange={handleTeacherChange}>
                          <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Öğretmen seçin" /></SelectTrigger>
                          <SelectContent>{teachers.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label} — {t.sinifSubeDisplay}</SelectItem>
                          ))}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-700">Sınıf *</Label>
                        <Select value={formData.sinif_key} onValueChange={handleClassChange}>
                          <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Sınıf seçin" /></SelectTrigger>
                          <SelectContent>{classes.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.text}</SelectItem>
                          ))}</SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Satır 4: Saatler + Süre */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-700">Çıkış Saati</Label>
                        <Input type="time" value={formData.cikis_saati}
                          onChange={(e) => setFormData({ ...formData, cikis_saati: e.target.value })} className="h-11 rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-700">Dönüş Saati</Label>
                        <Input type="time" value={formData.donus_saati}
                          onChange={(e) => setFormData({ ...formData, donus_saati: e.target.value })} className="h-11 rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-700">Süre</Label>
                        <Input value={formData.sure} onChange={(e) => setFormData({ ...formData, sure: e.target.value })}
                          placeholder="Örn: 2 saat" className="h-11 rounded-xl" />
                      </div>
                    </div>

                    {/* Satır 5: Refakatçi + Katılımcı */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-700">Refakatçiler</Label>
                        <Input value={formData.refakatci} onChange={(e) => setFormData({ ...formData, refakatci: e.target.value })}
                          placeholder="Refakatçi öğretmen/veli" className="h-11 rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-700">Katılımcı Sayısı</Label>
                        <Input type="number" value={formData.katilimci_sayisi || ""}
                          onChange={(e) => setFormData({ ...formData, katilimci_sayisi: Number(e.target.value) || 0 })}
                          className="h-11 rounded-xl" />
                      </div>
                    </div>

                    {/* Araç Bilgileri */}
                    <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 space-y-4">
                      <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Bus className="h-4 w-4 text-slate-500" /> Araç Bilgileri
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">Firma Adı</Label>
                          <Input value={formData.arac_firma} onChange={(e) => setFormData({ ...formData, arac_firma: e.target.value })} className="h-10 rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">Şoför Adı</Label>
                          <Input value={formData.arac_sofor} onChange={(e) => setFormData({ ...formData, arac_sofor: e.target.value })} className="h-10 rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">Araç Plakası</Label>
                          <Input value={formData.arac_plaka} onChange={(e) => setFormData({ ...formData, arac_plaka: e.target.value })} className="h-10 rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-500">Şoför Telefonu</Label>
                          <Input value={formData.arac_telefon} onChange={(e) => setFormData({ ...formData, arac_telefon: e.target.value })} className="h-10 rounded-xl" />
                        </div>
                      </div>
                    </div>

                    {/* Açıklama */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-700">Açıklama</Label>
                      <textarea className="flex w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 min-h-[80px]"
                        value={formData.aciklama} onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })} placeholder="Ek notlar..." />
                    </div>

                    {/* Butonlar */}
                    <div className="flex gap-3 pt-2">
                      <Button onClick={handleSave}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl shadow-lg shadow-emerald-200">
                        <Save className="h-4 w-4 mr-2" /> {editingId ? "Güncelle" : "Kaydet"}
                      </Button>
                      <Button variant="outline" onClick={resetForm} className="rounded-xl">
                        <X className="h-4 w-4 mr-1" /> İptal
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Etkinlik Listesi */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-emerald-200 rounded-full animate-spin border-t-emerald-500" />
                <MapPin className="h-6 w-6 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-slate-400 mt-4 text-sm">Etkinlikler yükleniyor...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <motion.div initial={fadeIn.hidden} animate={fadeIn.visible}>
              <Card className="py-16 border-dashed border-2 border-slate-200 bg-slate-50/50 rounded-2xl">
                <CardContent className="text-center">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-10 w-10 text-emerald-400" />
                  </div>
                  <p className="text-lg font-semibold text-slate-600">Henüz etkinlik yok</p>
                  <p className="text-sm text-slate-400 mt-1 mb-4">Yeni bir okul dışı etkinlik ekleyerek başlayın</p>
                  <Button onClick={() => { resetForm(); setShowForm(true); }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl">
                    <Plus className="h-4 w-4 mr-2" /> İlk Etkinliği Oluştur
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
              {filteredActivities.map((a, index) => (
                <motion.div key={a.id} variants={fadeIn} transition={{ duration: 0.3, delay: index * 0.05 }}>
                  <Card className="group hover:shadow-lg transition-all duration-300 rounded-xl border-slate-200 hover:border-emerald-300 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-start p-4">
                        {/* Sol: Tarih badge */}
                        <div className="hidden sm:flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 mr-4 shrink-0">
                          <span className="text-xs font-medium text-emerald-600">{new Date(a.etkinlik_tarihi + 'T00:00:00').toLocaleDateString('tr-TR', { month: 'short' })}</span>
                          <span className="text-xl font-bold text-emerald-700">{new Date(a.etkinlik_tarihi + 'T00:00:00').getDate()}</span>
                        </div>

                        {/* Orta: İçerik */}
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="font-semibold text-slate-800 truncate">{a.etkinlik_adi}</h3>
                            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs shrink-0">{a.sinif_display}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {a.mekan}</span>
                            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-slate-400" /> {a.ogretmen_adi}</span>
                            {a.cikis_saati && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-slate-400" /> {a.cikis_saati} - {a.donus_saati || "?"}</span>}
                          </div>
                        </div>

                        {/* Sağ: Aksiyonlar */}
                        <div className="flex items-center gap-0.5 ml-3 opacity-70 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="rounded-lg hover:bg-emerald-50"
                            onClick={() => { setSelectedActivityId(a.id); setActiveTab("belgeler"); }} title="Belge Oluştur">
                            <Printer className="h-4 w-4 text-emerald-600" />
                          </Button>
                          <Button variant="ghost" size="sm" className="rounded-lg hover:bg-blue-50" onClick={() => handleEdit(a)} title="Düzenle">
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="sm" className="rounded-lg hover:bg-red-50" onClick={() => handleDelete(a.id)} title="Sil">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                          <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}>
                            <motion.div animate={{ rotate: expandedId === a.id ? 180 : 0 }} transition={{ duration: 0.2 }}>
                              <ChevronDown className="h-4 w-4" />
                            </motion.div>
                          </Button>
                        </div>
                      </div>

                      {/* Genişletilmiş detay */}
                      <AnimatePresence>
                        {expandedId === a.id && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }} className="overflow-hidden">
                            <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                {a.guzergah && <div className="flex items-center gap-2"><Route className="h-3.5 w-3.5 text-slate-400" /><span className="text-slate-400">Güzergah:</span> <span className="font-medium">{a.guzergah}</span></div>}
                                {a.sure && <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-slate-400" /><span className="text-slate-400">Süre:</span> <span className="font-medium">{a.sure}</span></div>}
                                {a.katilimci_sayisi > 0 && <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-slate-400" /><span className="text-slate-400">Katılımcı:</span> <span className="font-medium">{a.katilimci_sayisi} kişi</span></div>}
                                {a.refakatci && <div className="flex items-center gap-2"><UserCheck className="h-3.5 w-3.5 text-slate-400" /><span className="text-slate-400">Refakatçi:</span> <span className="font-medium">{a.refakatci}</span></div>}
                                {a.arac_firma && <div className="flex items-center gap-2"><Bus className="h-3.5 w-3.5 text-slate-400" /><span className="text-slate-400">Firma:</span> <span className="font-medium">{a.arac_firma}</span></div>}
                                {a.arac_plaka && <div><span className="text-slate-400">Plaka:</span> <span className="font-medium">{a.arac_plaka}</span></div>}
                                {a.aciklama && <div className="col-span-full"><span className="text-slate-400">Açıklama:</span> <span className="font-medium">{a.aciklama}</span></div>}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabsContent>

        {/* ==================== SEKME 2: BELGE OLUŞTUR ==================== */}
        <TabsContent value="belgeler" className="space-y-4 mt-4">
          <AnimatePresence mode="wait">
            {showEditor ? (
              /* ===== EDİTÖR GÖRÜNÜMÜ ===== */
              <motion.div key="editor" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
                {/* Editör toolbar */}
                <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="sm" onClick={() => setShowEditor(false)}
                        className="text-white hover:bg-white/10 rounded-lg">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Geri
                      </Button>
                      <div className="h-5 w-px bg-white/20" />
                      <h3 className="font-medium text-sm truncate max-w-md">{editorTitle}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={printFromEditor}
                        className="bg-white text-slate-800 hover:bg-slate-100 rounded-lg shadow-md">
                        <Printer className="h-4 w-4 mr-2" /> Yazdır / PDF
                      </Button>
                    </div>
                  </div>
                  <div className="bg-slate-100 p-4 md:p-8">
                    <div className="bg-white rounded-xl shadow-lg mx-auto max-w-[210mm] min-h-[297mm] p-[40px] border border-slate-200">
                      <div ref={editorRef} contentEditable suppressContentEditableWarning
                        className="outline-none min-h-[500px] prose prose-sm max-w-none [&_table]:border-collapse [&_td]:border [&_td]:border-black [&_td]:p-2 [&_th]:border [&_th]:border-black [&_th]:p-2 [&_table]:w-full"
                        style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "12pt", lineHeight: 1.6 }}
                        dangerouslySetInnerHTML={{ __html: editorHtml }}
                      />
                    </div>
                  </div>
                  <div className="bg-slate-50 px-6 py-3 border-t text-xs text-slate-400 flex items-center justify-between">
                    <span>Belgeyi doğrudan düzenleyebilirsiniz. Değişiklikler yazdırma çıktısına yansır.</span>
                    <Button variant="ghost" size="sm" onClick={printFromEditor} className="text-slate-500 hover:text-slate-700">
                      <Printer className="h-3.5 w-3.5 mr-1" /> Yazdır
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              /* ===== BELGE SEÇİM GÖRÜNÜMÜ ===== */
              <motion.div key="selector" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} transition={{ duration: 0.3 }} className="space-y-4">
                {/* Etkinlik Seçici */}
                <motion.div initial={fadeIn.hidden} animate={fadeIn.visible}>
                  <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
                    <CardContent className="p-6">
                      <Label className="text-base font-semibold mb-3 block text-slate-700">Etkinlik Seçin</Label>
                      <Select value={selectedActivityId} onValueChange={setSelectedActivityId}>
                        <SelectTrigger className="w-full h-12 rounded-xl text-left">
                          <SelectValue placeholder="Belge oluşturmak istediğiniz etkinliği seçin..." />
                        </SelectTrigger>
                        <SelectContent>{activities.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                              {a.etkinlik_adi} — {a.sinif_display} — {a.etkinlik_tarihi}
                            </div>
                          </SelectItem>
                        ))}</SelectContent>
                      </Select>

                      {selectedActivity && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div className="space-y-0.5">
                                <p className="text-emerald-600 text-xs font-medium">Etkinlik</p>
                                <p className="font-semibold text-slate-800">{selectedActivity.etkinlik_adi}</p>
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-emerald-600 text-xs font-medium">Sınıf</p>
                                <p className="font-semibold text-slate-800">{selectedActivity.sinif_display}</p>
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-emerald-600 text-xs font-medium">Öğretmen</p>
                                <p className="font-semibold text-slate-800">{selectedActivity.ogretmen_adi}</p>
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-emerald-600 text-xs font-medium">Tarih</p>
                                <p className="font-semibold text-slate-800">{selectedActivity.etkinlik_tarihi}</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Evrak Kartları */}
                <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {DOCUMENT_TYPES.map((doc) => {
                    const Icon = doc.icon;
                    const c = COLOR_MAP[doc.color] || COLOR_MAP.blue;
                    const disabled = !selectedActivityId;

                    return (
                      <motion.div key={doc.id} variants={fadeIn} whileHover={disabled ? {} : cardHover} whileTap={disabled ? {} : { scale: 0.98 }} transition={{ duration: 0.2 }}>
                        <Card className={`cursor-pointer transition-all duration-200 rounded-2xl overflow-hidden border-2 ${disabled ? "opacity-40 pointer-events-none border-slate-100" : `${c.border} hover:${c.ring}`}`}
                          onClick={() => handleGenerateDocument(doc.id)}>
                          <CardContent className="p-0">
                            <div className={`h-2 bg-gradient-to-r ${doc.gradient}`} />
                            <div className="p-5">
                              <div className={`w-14 h-14 rounded-2xl ${c.light} flex items-center justify-center mb-4 shadow-sm`}>
                                <Icon className={`h-7 w-7 ${c.text}`} />
                              </div>
                              <h3 className="font-bold text-slate-800 mb-1">{doc.label}</h3>
                              <p className="text-sm text-slate-500 leading-relaxed">{doc.description}</p>
                              <div className="mt-4 flex items-center gap-2">
                                <div className={`flex items-center gap-1.5 text-xs font-medium ${c.text} ${c.light} px-3 py-1.5 rounded-full`}>
                                  <Eye className="h-3 w-3" /> Önizle & Düzenle
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>

                {!selectedActivityId && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-slate-400 text-sm py-6">
                    Belge oluşturmak için önce yukarıdan bir etkinlik seçin
                  </motion.p>
                )}

                {isGenerating && (
                  <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
                      <div className="w-16 h-16 border-4 border-emerald-200 rounded-full animate-spin border-t-emerald-500" />
                      <p className="font-medium text-slate-700">Belge oluşturuluyor...</p>
                      <p className="text-sm text-slate-400">Öğrenci listesi yükleniyor</p>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  );
}
