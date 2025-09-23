"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Send, X, Users, GraduationCap, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";

import { SinifSube, Ogrenci, YonlendirilenOgrenci, YONLENDIRME_NEDENLERI } from "@/types";

const formSchema = z.object({
  ogretmenAdi: z.string().min(2, "Öğretmen adı en az 2 karakter olmalıdır"),
  sinifSube: z.string().min(1, "Sınıf/Şube seçimi zorunludur"),
  ogrenci: z.string().min(1, "Öğrenci seçimi zorunludur"),
  yonlendirmeNedenleri: z.array(z.string()).min(1, "En az bir yönlendirme nedeni seçilmelidir"),
  not: z.string().optional(),
});

export default function RPDYonlendirme() {
  const [sinifSubeList, setSinifSubeList] = useState<SinifSube[]>([]);
  const [ogrenciList, setOgrenciList] = useState<Ogrenci[]>([]);
  const [yonlendirilenOgrenciler, setYonlendirilenOgrenciler] = useState<YonlendirilenOgrenci[]>([]);
  const [loading, setLoading] = useState(true);
  const [ogrenciLoading, setOgrenciLoading] = useState(false);
  const [teacherOptions, setTeacherOptions] = useState<{ value: string; label: string; sinifSubeKey: string; sinifSubeDisplay: string }[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ogretmenAdi: "",
      sinifSube: "",
      ogrenci: "",
      yonlendirmeNedenleri: [],
      not: "",
    },
  });

  // Veri yükle
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/data');
        const data = await response.json();
        setSinifSubeList(data.sinifSubeList);
        // load teachers
        const tRes = await fetch('/api/teachers');
        const tJson = await tRes.json();
        if (tJson && Array.isArray(tJson.teachers)) setTeacherOptions(tJson.teachers);
        setLoading(false);
      } catch (error) {
        console.error('Veri yüklenirken hata:', error);
        toast.error("Veri yüklenirken hata oluştu");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Sınıf değiştiğinde öğrenci listesini güncelle
  const handleSinifChange = async (sinifSube: string) => {
    console.log('🔄 Sınıf değişti:', sinifSube);
    setOgrenciLoading(true);
    try {
      const response = await fetch(`/api/students?sinifSube=${sinifSube}`);
      const data = await response.json();
      console.log('📚 API Yanıtı:', Array.isArray(data) ? `${data.length} öğrenci` : typeof data, data);
      // API'den gelen verinin array olduğundan emin ol
      const ogrenciArray = Array.isArray(data) ? data : [];
      setOgrenciList(ogrenciArray);
      console.log('✅ Öğrenci listesi güncellendi:', ogrenciArray.length, 'öğrenci');
      form.setValue("ogrenci", ""); // Öğrenci seçimini sıfırla
    } catch (error) {
      console.error('❌ Öğrenci listesi yüklenirken hata:', error);
      toast.error("Öğrenci listesi yüklenirken hata oluştu");
      // Hata durumunda boş array ata
      setOgrenciList([]);
    } finally {
      setOgrenciLoading(false);
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // If teachers data exists, enforce UI-level validation and auto class
    const t = teacherOptions.find(t => t.value === values.ogretmenAdi);
    if (t) {
      if (values.sinifSube !== t.sinifSubeKey) {
        toast.error(`Hatalı sınıf/şube seçtiniz. ${t.label} yalnızca ${t.sinifSubeDisplay} öğretmenidir.`);
        return;
      }
    }
    const sinifSubeText = sinifSubeList.find(s => s.value === values.sinifSube)?.text || "";
    const ogrenciAdi = ogrenciList.find(o => o.value === values.ogrenci)?.text || "";
    
    // Her seçilen neden için ayrı bir öğrenci entry'si oluştur
    const yeniOgrenciler: YonlendirilenOgrenci[] = values.yonlendirmeNedenleri.map(neden => ({
      id: `${Date.now()}-${Math.random()}-${neden}`,
      ogretmenAdi: values.ogretmenAdi,
      sinifSube: sinifSubeText,
      ogrenciAdi: ogrenciAdi,
      yonlendirmeNedeni: neden,
      not: values.not?.trim() ? values.not : undefined,
      tarih: new Date().toLocaleString('tr-TR'),
    }));

    setYonlendirilenOgrenciler(prev => [...prev, ...yeniOgrenciler]);
    
    // Formu kısmen sıfırla (öğretmen adı ve öğrenci seçimi korunur)
    form.setValue("yonlendirmeNedenleri", []);
    form.setValue("not", "");
    
    toast.success(`${ogrenciAdi} ${values.yonlendirmeNedenleri.length} farklı nedenle başarıyla eklendi`);
  };

  const removeStudent = (id: string) => {
    setYonlendirilenOgrenciler(prev => prev.filter(o => o.id !== id));
    toast.success("Öğrenci listeden çıkarıldı");
  };

  const sendToGuidance = async () => {
    if (yonlendirilenOgrenciler.length === 0) {
      toast.error("Yönlendirilecek öğrenci bulunmuyor");
      return;
    }

    try {
      const response = await fetch('/api/send-guidance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ students: yonlendirilenOgrenciler }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        if (result.telegram && result.sheets) {
          toast.success("✅ Öğrenciler Telegram ve Google Sheets'e başarıyla gönderildi!");
        } else if (result.telegram || result.sheets) {
          toast.success("⚠️ Öğrenciler kısmen gönderildi. " + result.message);
        } else {
          toast.error("❌ Gönderim başarısız: " + result.message);
        }
        
        // Only clear the list if at least one integration succeeded
        if (result.telegram || result.sheets) {
          setYonlendirilenOgrenciler([]);
        }
      } else {
        toast.error("❌ Gönderim sırasında hata oluştu: " + (result.message || result.error));
      }
    } catch (error) {
      console.error('Gönderim hatası:', error);
      toast.error("❌ Gönderim sırasında hata oluştu");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        <div className="text-center relative z-10">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mb-6"></div>
            <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-transparent via-white to-transparent mx-auto" style={{animationDuration: '1s'}}></div>
          </div>
          <p className="text-xl font-medium bg-gradient-to-r from-gray-700 to-blue-600 bg-clip-text text-transparent animate-pulse">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 pb-20 md:pb-0 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-400/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-7xl relative z-10">
        {/* Header */}
        <div className="text-center mb-4 md:mb-8">
          <div className="flex items-center justify-center mb-2 md:mb-4">
            <GraduationCap className="h-8 w-8 md:h-12 md:w-12 text-blue-600 mr-2 md:mr-3 hover:text-purple-600 hover:scale-110 transition-all duration-300 drop-shadow-lg" />
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 via-blue-800 to-purple-800 bg-clip-text text-transparent hover:from-blue-600 hover:to-purple-600 transition-all duration-500">RPD Öğrenci Yönlendirme</h1>
          </div>
          <p className="text-sm md:text-lg text-gray-600 px-2">Rehberlik ve Psikolojik Danışmanlık Servisi Öğrenci Tespit Programı</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-8">
          {/* Form Kartı */}
          <Card className="shadow-xl shadow-blue-500/10 backdrop-blur-sm bg-white/80 border-0 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 hover:-translate-y-1 group">
            <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-t-lg p-4 md:p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <CardTitle className="flex items-center text-lg md:text-xl relative z-10">
                <FileText className="h-5 w-5 md:h-6 md:w-6 mr-2 group-hover:rotate-3 transition-transform duration-300" />
                Öğrenci Yönlendirme Formu
              </CardTitle>
              <CardDescription className="text-blue-100 text-sm md:text-base">
                Rehberlik servisine yönlendirilecek öğrenci bilgilerini girin
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
                  <FormField
                    control={form.control}
                    name="ogretmenAdi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Öğretmen Adı Soyadı *</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(val) => {
                              console.log('👨‍🏫 Öğretmen değişti:', val);
                              field.onChange(val);
                              const t = teacherOptions.find(t => t.value === val);
                              if (t) {
                                console.log('🎯 Öğretmen bulundu:', t.label, '-> Sınıf:', t.sinifSubeDisplay);
                                // auto select class and fetch students
                                form.setValue('sinifSube', t.sinifSubeKey, { shouldValidate: true });
                                form.setValue('ogrenci', ''); // Öğrenci seçimini sıfırla
                                // Küçük bir delay ile öğrenci listesini yükle
                                setTimeout(() => {
                                  handleSinifChange(t.sinifSubeKey);
                                }, 100);
                              } else {
                                console.log('⚠️  Öğretmen bulunamadı, listeler temizleniyor');
                                // Öğretmen seçimi temizlenirse öğrenci listesini de temizle
                                setOgrenciList([]);
                                form.setValue('ogrenci', '');
                              }
                            }}
                            value={field.value}
                          >
                            <SelectTrigger className="border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/70 backdrop-blur-sm hover:bg-white/90 hover:shadow-md h-12 px-4 text-base">
                              <SelectValue placeholder="🧑‍🏫 Öğretmen seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {teacherOptions.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sinifSube"
                    render={({ field }) => {
                      const t = teacherOptions.find(t => t.value === form.getValues('ogretmenAdi'));
                      return (
                        <FormItem>
                          <FormLabel>Sınıf / Şube *</FormLabel>
                          <Select
                            onValueChange={(value) => { field.onChange(value); handleSinifChange(value); }}
                            value={field.value}
                            disabled={Boolean(t)}
                          >
                            <FormControl>
                              <SelectTrigger className="border-2 border-gray-200 hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-300 bg-white/70 backdrop-blur-sm hover:bg-white/90 hover:shadow-md h-12 px-4 text-base">
                                <SelectValue placeholder="🏫 Sınıf/Şube seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(t ? sinifSubeList.filter(s => s.value === t.sinifSubeKey) : sinifSubeList).map((sinif) => (
                                <SelectItem key={sinif.value} value={sinif.value}>
                                  {sinif.text}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="ogrenci"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Öğrenci *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 bg-white/70 backdrop-blur-sm hover:bg-white/90 hover:shadow-md h-12 px-4 text-base">
                              <SelectValue placeholder={ogrenciLoading ? "🔄 Öğrenciler yükleniyor..." : "👤 Öğrenci seçin"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ogrenciLoading ? (
                              <SelectItem value="loading" disabled>🔄 Yükleniyor...</SelectItem>
                            ) : (ogrenciList || []).length === 0 ? (
                              <SelectItem value="empty" disabled>📭 Bu sınıfta öğrenci bulunamadı</SelectItem>
                            ) : (
                              (ogrenciList || []).map((ogrenci) => (
                                <SelectItem key={ogrenci.value} value={ogrenci.value}>
                                  {ogrenci.text}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="yonlendirmeNedenleri"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yönlendirme Nedenleri (Birden fazla seçilebilir)</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 md:gap-3 border-2 border-gray-200 rounded-lg p-3 md:p-4 bg-white/50 backdrop-blur-sm">
                          {YONLENDIRME_NEDENLERI.map((neden) => (
                            <div key={neden} className="flex items-start space-x-3 min-h-[44px] group">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  id={neden}
                                  checked={field.value?.includes(neden) || false}
                                  onChange={(e) => {
                                    const currentValues = field.value || [];
                                    if (e.target.checked) {
                                      field.onChange([...currentValues, neden]);
                                    } else {
                                      field.onChange(currentValues.filter(v => v !== neden));
                                    }
                                  }}
                                  className="sr-only"
                                />
                                <div className={`w-5 h-5 md:w-6 md:h-6 rounded border-2 transition-all duration-300 cursor-pointer flex items-center justify-center ${
                                  field.value?.includes(neden) 
                                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 border-blue-500 shadow-lg shadow-blue-500/30' 
                                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 group-hover:scale-110'
                                }`}>
                                  {field.value?.includes(neden) && (
                                    <svg className="w-3 h-3 md:w-4 md:h-4 text-white animate-in zoom-in-50 duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <label htmlFor={neden} className="text-sm md:text-base font-medium leading-tight cursor-pointer py-2 flex-1 transition-colors duration-200 group-hover:text-blue-700">
                                {neden}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Not alanı */}
                  <FormField
                    control={form.control}
                    name="not"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Not (opsiyonel)</FormLabel>
                        <FormControl>
                          <textarea
                            className="w-full min-h-20 md:min-h-24 rounded-md border-2 border-gray-200 hover:border-orange-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 bg-white/70 backdrop-blur-sm hover:bg-white/90 px-3 py-2 text-sm md:text-base shadow-sm outline-none transition-all duration-300 resize-none hover:shadow-md"
                            placeholder="📝 Örn: Öğrenci sürekli ağlıyor, sürekli şiddet uyguluyor"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 min-h-[48px] md:min-h-[44px] text-base md:text-sm font-medium shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <Plus className="h-5 w-5 md:h-4 md:w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                    <span className="relative z-10">Öğrenci Ekle</span>
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Yönlendirilen Öğrenciler Listesi */}
          <Card className="shadow-xl shadow-green-500/10 backdrop-blur-sm bg-white/80 border-0 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-500 hover:-translate-y-1 group">
            <CardHeader className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white rounded-t-lg p-4 md:p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <CardTitle className="flex items-center justify-between text-lg md:text-xl relative z-10">
                <div className="flex items-center">
                  <Users className="h-5 w-5 md:h-6 md:w-6 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Yönlendirilen Öğrenciler
                </div>
                <Badge variant="secondary" className="bg-white text-green-600 text-sm md:text-base px-3 py-1 shadow-lg shadow-green-500/20 border border-green-200 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 animate-pulse">
                  {yonlendirilenOgrenciler.length}
                </Badge>
              </CardTitle>
              <CardDescription className="text-green-100 text-sm md:text-base">
                Rehberlik servisine gönderilecek öğrenciler
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {yonlendirilenOgrenciler.length === 0 ? (
                <div className="text-center py-6 md:py-8 text-gray-500">
                  <div className="relative inline-block">
                    <Users className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-2 md:mb-4 opacity-50 animate-pulse" />
                    <div className="absolute inset-0 h-8 w-8 md:h-12 md:w-12 mx-auto bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  </div>
                  <p className="text-sm md:text-base animate-fade-in">Henüz yönlendirilen öğrenci bulunmuyor</p>
                  <p className="text-xs text-gray-400 mt-2">Forma öğrenci ekleyince burada görünecek</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {yonlendirilenOgrenciler.map((ogrenci) => (
                    <div
                      key={ogrenci.id}
                      className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-3 md:p-4 bg-gray-50 rounded-lg border gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 text-sm md:text-base break-words">{ogrenci.ogrenciAdi}</div>
                        <div className="text-xs md:text-sm text-gray-600 mt-1">{ogrenci.sinifSube}</div>
                        <div className="text-xs md:text-sm text-gray-600">Öğretmen: {ogrenci.ogretmenAdi}</div>
                        <Badge variant="outline" className="mt-2 text-xs bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-purple-100 transition-all duration-300 shadow-sm">
                          {ogrenci.yonlendirmeNedeni}
                        </Badge>
                        {ogrenci.not && (
                          <div className="text-xs text-gray-500 mt-1 italic">Not: {ogrenci.not}</div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStudent(ogrenci.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 self-end sm:self-start min-h-[36px] min-w-[36px] p-2 rounded-full hover:scale-110 transition-all duration-200 group"
                      >
                        <X className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
                      </Button>
                    </div>
                  ))}
                  
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Sticky Gönder Butonu - Sadece öğrenci varsa görünür */}
        {yonlendirilenOgrenciler.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-200 p-4 shadow-2xl z-50 md:hidden">
            <div className="container mx-auto max-w-md">
              <Button
                onClick={sendToGuidance}
                className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 min-h-[52px] text-base font-medium shadow-xl shadow-green-500/30 hover:shadow-2xl hover:shadow-green-500/40 transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group"
                disabled={yonlendirilenOgrenciler.length === 0}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <Send className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                <span className="relative z-10">Gönder ({yonlendirilenOgrenciler.length})</span>
              </Button>
            </div>
          </div>
        )}
        
        {/* Desktop için normal buton */}
        {yonlendirilenOgrenciler.length > 0 && (
          <div className="hidden md:block">
            <div className="container mx-auto px-4 max-w-7xl">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-8">
                <div></div> {/* Boş alan - form alanı için */}
                <div className="mt-4">
                  <Button
                    onClick={sendToGuidance}
                    className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 min-h-[44px] text-sm font-medium shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group"
                    disabled={yonlendirilenOgrenciler.length === 0}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <Send className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="relative z-10">Rehberlik Servisine Gönder ({yonlendirilenOgrenciler.length})</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}