"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Save, Code, Plus, Trash2, Users, FileCode, GraduationCap, Layers, User, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { MebbisExcelData, MebbisFormData, MebbisBulkFormData, RpdStageData, SelectOption } from '@/types/mebbis';

interface MebbisRPDFormProps {
  excelData: MebbisExcelData;
  onGenerateScript: (formData: MebbisFormData) => void;
  onBulkGenerateScript: (bulkData: MebbisBulkFormData) => void;
}

const MebbisRPDForm: React.FC<MebbisRPDFormProps> = ({ excelData, onGenerateScript, onBulkGenerateScript }) => {
  const [rpdStageData, setRpdStageData] = useState<RpdStageData | null>(null);
  const [formData, setFormData] = useState<MebbisFormData>({
    sinifSube: '',
    ogrenci: '',
    rpdHizmetTuru: '',
    asama1: '',
    asama2: '',
    asama3: '',
    gorusmeTarihi: '',
    gorusmeBaslamaSaati: '',
    gorusmeBitisSaati: '',
    calismaYeri: ''
  });

  const [errors, setErrors] = useState<Partial<MebbisFormData>>({});
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkRecords, setBulkRecords] = useState<MebbisFormData[]>([]);

  // RPD aşama verilerini yükle
  useEffect(() => {
    const loadRpdStageData = async () => {
      try {
        const response = await fetch('/rpd_asamalar.json');
        const data = await response.json();
        setRpdStageData(data);
      } catch (error) {
        console.error('RPD aşama verileri yüklenemedi:', error);
      }
    };

    loadRpdStageData();
  }, []);

  // RPD Hizmet Türü seçimine göre 1. Aşama listesini getir
  const getStage1List = (): SelectOption[] => {
    if (!formData.rpdHizmetTuru || !rpdStageData) return [];

    const serviceCode = formData.rpdHizmetTuru;
    const serviceData = rpdStageData.services[serviceCode];

    if (!serviceData) return [];

    return serviceData.asama_1.secenekler.map(item => ({
      value: item.deger,
      text: item.metin
    }));
  };

  // 1. Aşama seçimine göre 2. Aşama listesini getir
  const getStage2List = (): SelectOption[] => {
    if (!formData.asama1 || !formData.rpdHizmetTuru || !rpdStageData) return [];

    const serviceCode = formData.rpdHizmetTuru;
    const serviceData = rpdStageData.services[serviceCode];

    if (!serviceData) return [];

    const stage1Option = serviceData.asama_1.secenekler.find(item => item.deger === formData.asama1);
    if (!stage1Option) return [];

    const stage2Dependency = serviceData.asama_2_bagimliliklari[stage1Option.metin];
    if (!stage2Dependency) return [];

    return stage2Dependency.secenekler.map(item => ({
      value: item.deger,
      text: item.metin
    }));
  };

  // 2. Aşama seçimine göre 3. Aşama listesini getir
  const getStage3List = (): SelectOption[] => {
    if (!formData.asama2 || !formData.asama1 || !formData.rpdHizmetTuru || !rpdStageData) return [];

    const serviceCode = formData.rpdHizmetTuru;
    const serviceData = rpdStageData.services[serviceCode];

    if (!serviceData) return [];

    const stage1Option = serviceData.asama_1.secenekler.find(item => item.deger === formData.asama1);
    if (!stage1Option) return [];

    const stage2Dependency = serviceData.asama_2_bagimliliklari[stage1Option.metin];
    if (!stage2Dependency) return [];

    const stage2Option = stage2Dependency.secenekler.find(item => item.deger === formData.asama2);
    if (!stage2Option) return [];

    const combinedKey = `${stage1Option.metin} → ${stage2Option.metin}`;
    const stage3Dependency = serviceData.asama_3_bagimliliklari[combinedKey];

    if (!stage3Dependency) return [];

    return stage3Dependency.secenekler.map(item => ({
      value: item.deger,
      text: item.metin
    }));
  };

  // Şube seçimine göre öğrenci listesini getir
  const getStudentList = (): SelectOption[] => {
    if (!formData.sinifSube) return [];

    const availableSheets = Object.keys(excelData);
    const studentSheets = availableSheets.filter(sheet =>
      sheet.toLowerCase().includes('ogrenci') ||
      sheet.toLowerCase().includes('öğrenci') ||
      sheet.toLowerCase().includes('student')
    );

    const selectedOption = excelData['Sinif_Sube']?.find(option => option.value === formData.sinifSube);
    if (!selectedOption) return [];

    const selectedText = selectedOption.text;
    const normalizedText = selectedText.replace('/', '_');
    const targetSheetName = `Ogrenci_${normalizedText}`;

    let targetSheet = studentSheets.find(sheet => sheet === targetSheetName);
    
    if (!targetSheet) {
      const parts = selectedText.split(' / ');
      if (parts.length === 2) {
        const className = parts[0];
        const branchName = parts[1];

        targetSheet = studentSheets.find(sheet => {
          const sheetLower = sheet.toLowerCase();
          const classLower = className.toLowerCase();
          const branchLower = branchName.toLowerCase();
          return sheetLower.includes(classLower) && sheetLower.includes(branchLower);
        });

        if (!targetSheet) {
          targetSheet = studentSheets.find(sheet => {
            const sheetLower = sheet.toLowerCase();
            const classLower = className.toLowerCase();
            return sheetLower.includes(classLower);
          });
        }
      }
    }

    if (targetSheet && excelData[targetSheet]) {
      return excelData[targetSheet];
    }

    return [];
  };

  const handleInputChange = (field: keyof MebbisFormData, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      if (field === 'sinifSube') {
        newData.ogrenci = '';
      } else if (field === 'rpdHizmetTuru') {
        newData.asama1 = '';
        newData.asama2 = '';
        newData.asama3 = '';
      } else if (field === 'asama1') {
        newData.asama2 = '';
        newData.asama3 = '';
      } else if (field === 'asama2') {
        newData.asama3 = '';
      }

      return newData;
    });

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<MebbisFormData> = {};

    if (!formData.sinifSube) newErrors.sinifSube = 'Sınıf/Şube seçimi zorunludur';
    if (!formData.ogrenci) newErrors.ogrenci = 'Öğrenci seçimi zorunludur';
    if (!formData.rpdHizmetTuru) newErrors.rpdHizmetTuru = 'RPD Hizmet Türü seçimi zorunludur';
    if (!formData.asama1) newErrors.asama1 = '1. Aşama seçimi zorunludur';
    if (!formData.asama2) newErrors.asama2 = '2. Aşama seçimi zorunludur';

    const isStage3Required = formData.asama1 === '18';
    if (isStage3Required && !formData.asama3) {
      newErrors.asama3 = '3. Aşama seçimi bu hizmet türü için zorunludur';
    }

    if (!formData.gorusmeTarihi) newErrors.gorusmeTarihi = 'Görüşme tarihi zorunludur';
    if (!formData.gorusmeBaslamaSaati) newErrors.gorusmeBaslamaSaati = 'Başlama saati zorunludur';
    if (!formData.gorusmeBitisSaati) newErrors.gorusmeBitisSaati = 'Bitiş saati zorunludur';
    if (!formData.calismaYeri) newErrors.calismaYeri = 'Çalışma yeri seçimi zorunludur';

    if (formData.gorusmeBaslamaSaati && formData.gorusmeBitisSaati) {
      if (formData.gorusmeBaslamaSaati >= formData.gorusmeBitisSaati) {
        newErrors.gorusmeBitisSaati = 'Bitiş saati, başlama saatinden sonra olmalıdır';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      if (isBulkMode) {
        const newRecords = [...bulkRecords, { ...formData }];
        setBulkRecords(newRecords);
        setFormData({
          sinifSube: '',
          ogrenci: '',
          rpdHizmetTuru: '',
          asama1: '',
          asama2: '',
          asama3: '',
          gorusmeTarihi: '',
          gorusmeBaslamaSaati: '',
          gorusmeBitisSaati: '',
          calismaYeri: ''
        });
      } else {
        onGenerateScript(formData);
      }
    }
  };

  const handleBulkFinish = () => {
    if (bulkRecords.length > 0) {
      onBulkGenerateScript({ records: bulkRecords, isBulkMode: true });
    }
  };

  const removeBulkRecord = (index: number) => {
    setBulkRecords(prev => prev.filter((_, i) => i !== index));
  };

  const clearBulkRecords = () => {
    setBulkRecords([]);
  };

  const renderSelect = (
    label: string,
    field: keyof MebbisFormData,
    dataKey: string,
    icon: React.ReactNode
  ) => {
    const options = excelData[dataKey] || [];

    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-gray-700 font-medium">
          {icon}
          {label}
        </Label>
        <select
          value={formData[field]}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
            errors[field] ? 'border-red-300 bg-red-50/50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <option value="">📋 Seçiniz...</option>
          {options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.text}
            </option>
          ))}
        </select>
        {formData[field] && (
          <p className="text-xs text-gray-500 flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg w-fit">
            <code className="font-mono text-indigo-600">{formData[field]}</code>
          </p>
        )}
        {errors[field] && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <span className="w-1 h-1 bg-red-500 rounded-full" />
            {errors[field]}
          </p>
        )}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
      <CardHeader className="relative overflow-hidden pb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-2xl" />
        <CardTitle className="relative flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <Save className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              RPD Form Bilgileri
            </span>
            <p className="text-sm font-normal text-gray-500 mt-0.5">Öğrenci ve görüşme bilgilerini doldurun</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-5">
              <div className="p-4 bg-gradient-to-br from-sky-50/80 to-blue-50/80 rounded-xl border border-sky-100">
                <h3 className="text-sm font-semibold text-sky-800 mb-4 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Öğrenci Bilgileri
                </h3>
                <div className="space-y-4">
                  {renderSelect(
                    'Sınıf / Şube',
                    'sinifSube',
                    'Sinif_Sube',
                    <Users className="h-4 w-4 text-sky-500" />
                  )}

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-gray-700 font-medium">
                      <User className="h-4 w-4 text-sky-500" />
                      Öğrenci
                    </Label>
                    <select
                      key={formData.sinifSube}
                      value={formData.ogrenci}
                      onChange={(e) => handleInputChange('ogrenci', e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                        errors.ogrenci ? 'border-red-300 bg-red-50/50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      disabled={!formData.sinifSube}
                    >
                      <option value="">
                        {!formData.sinifSube ? '⚠️ Önce şube seçiniz...' : '🎓 Öğrenci seçiniz...'}
                      </option>
                      {getStudentList().map((option, index) => (
                        <option key={index} value={option.value}>
                          {option.text}
                        </option>
                      ))}
                    </select>
                    {formData.ogrenci && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg w-fit">
                        <code className="font-mono text-indigo-600">{formData.ogrenci}</code>
                      </p>
                    )}
                    {errors.ogrenci && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full" />
                        {errors.ogrenci}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 rounded-xl border border-indigo-100">
                <h3 className="text-sm font-semibold text-indigo-800 mb-4 flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  RPD Hizmet Aşamaları
                </h3>
                <div className="space-y-4">
                  {renderSelect(
                    'RPD Hizmet Türü',
                    'rpdHizmetTuru',
                    'RPD_Hizmet_Turu',
                    <FileCode className="h-4 w-4 text-indigo-500" />
                  )}

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-gray-700 font-medium">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">1</span>
                      1. Aşama
                    </Label>
                    <select
                      value={formData.asama1}
                      onChange={(e) => handleInputChange('asama1', e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                        errors.asama1 ? 'border-red-300 bg-red-50/50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      disabled={!formData.rpdHizmetTuru || !rpdStageData}
                    >
                      <option value="">
                        {!formData.rpdHizmetTuru ? '⚠️ Önce RPD Hizmet Türü seçiniz...' :
                         !rpdStageData ? '⏳ Aşama verileri yükleniyor...' : '📋 Seçiniz...'}
                      </option>
                      {getStage1List().map((option, index) => (
                        <option key={index} value={option.value}>
                          {option.text}
                        </option>
                      ))}
                    </select>
                    {formData.asama1 && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg w-fit">
                        <code className="font-mono text-indigo-600">{formData.asama1}</code>
                      </p>
                    )}
                    {errors.asama1 && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full" />
                        {errors.asama1}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-gray-700 font-medium">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">2</span>
                      2. Aşama
                    </Label>
                    <select
                      value={formData.asama2}
                      onChange={(e) => handleInputChange('asama2', e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                        errors.asama2 ? 'border-red-300 bg-red-50/50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      disabled={!formData.asama1 || !rpdStageData}
                    >
                      <option value="">
                        {!formData.asama1 ? '⚠️ Önce 1. Aşama seçiniz...' :
                         !rpdStageData ? '⏳ Aşama verileri yükleniyor...' : '📋 Seçiniz...'}
                      </option>
                      {getStage2List().map((option, index) => (
                        <option key={index} value={option.value}>
                          {option.text}
                        </option>
                      ))}
                    </select>
                    {formData.asama2 && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg w-fit">
                        <code className="font-mono text-indigo-600">{formData.asama2}</code>
                      </p>
                    )}
                    {errors.asama2 && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full" />
                        {errors.asama2}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              <div className="p-4 bg-gradient-to-br from-purple-50/80 to-pink-50/80 rounded-xl border border-purple-100">
                <h3 className="text-sm font-semibold text-purple-800 mb-4 flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  3. Aşama & Detaylar
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-gray-700 font-medium">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">3</span>
                      3. Aşama
                      {formData.asama1 !== '18' && formData.asama2 && (
                        <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full font-medium">
                          Opsiyonel
                        </span>
                      )}
                      {formData.asama1 === '18' && (
                        <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full font-medium">
                          Zorunlu
                        </span>
                      )}
                    </Label>
                    <select
                      value={formData.asama3}
                      onChange={(e) => handleInputChange('asama3', e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                        errors.asama3 ? 'border-red-300 bg-red-50/50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      disabled={!formData.asama2 || !rpdStageData}
                    >
                      <option value="">
                        {!formData.asama2 ? '⚠️ Önce 2. Aşama seçiniz...' :
                         !rpdStageData ? '⏳ Aşama verileri yükleniyor...' :
                         formData.asama1 !== '18' ? '📋 Seçiniz... (opsiyonel)' : '📋 Seçiniz...'}
                      </option>
                      {getStage3List().map((option, index) => (
                        <option key={index} value={option.value}>
                          {option.text}
                        </option>
                      ))}
                    </select>
                    {formData.asama3 && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg w-fit">
                        <code className="font-mono text-purple-600">{formData.asama3}</code>
                      </p>
                    )}
                    {errors.asama3 && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full" />
                        {errors.asama3}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-amber-50/80 to-orange-50/80 rounded-xl border border-amber-100">
                <h3 className="text-sm font-semibold text-amber-800 mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Görüşme Bilgileri
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-gray-700 font-medium">
                      <Calendar className="h-4 w-4 text-amber-500" />
                      Görüşme Tarihi
                    </Label>
                    <Input
                      type="date"
                      value={formData.gorusmeTarihi}
                      onChange={(e) => handleInputChange('gorusmeTarihi', e.target.value)}
                      className={`px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 bg-white/80 ${
                        errors.gorusmeTarihi ? 'border-red-300 bg-red-50/50' : 'border-gray-200'
                      }`}
                    />
                    {errors.gorusmeTarihi && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full" />
                        {errors.gorusmeTarihi}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-gray-700 font-medium">
                        <Clock className="h-4 w-4 text-amber-500" />
                        Başlama
                      </Label>
                      <Input
                        type="time"
                        value={formData.gorusmeBaslamaSaati}
                        onChange={(e) => handleInputChange('gorusmeBaslamaSaati', e.target.value)}
                        className={`px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 bg-white/80 ${
                          errors.gorusmeBaslamaSaati ? 'border-red-300 bg-red-50/50' : 'border-gray-200'
                        }`}
                      />
                      {errors.gorusmeBaslamaSaati && (
                        <p className="text-sm text-red-600">{errors.gorusmeBaslamaSaati}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-gray-700 font-medium">
                        <Clock className="h-4 w-4 text-amber-500" />
                        Bitiş
                      </Label>
                      <Input
                        type="time"
                        value={formData.gorusmeBitisSaati}
                        onChange={(e) => handleInputChange('gorusmeBitisSaati', e.target.value)}
                        className={`px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 bg-white/80 ${
                          errors.gorusmeBitisSaati ? 'border-red-300 bg-red-50/50' : 'border-gray-200'
                        }`}
                      />
                      {errors.gorusmeBitisSaati && (
                        <p className="text-sm text-red-600">{errors.gorusmeBitisSaati}</p>
                      )}
                    </div>
                  </div>

                  {renderSelect(
                    'Çalışmanın Yapıldığı Yer',
                    'calismaYeri',
                    'Calisma_Yeri',
                    <MapPin className="h-4 w-4 text-amber-500" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Section */}
          <div className="pt-6 border-t border-gray-200 space-y-4">
            {/* Mode Toggle */}
            <div className="flex items-center justify-center gap-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="radio"
                    name="mode"
                    checked={!isBulkMode}
                    onChange={() => {
                      setIsBulkMode(false);
                      setBulkRecords([]);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full peer-checked:border-indigo-500 peer-checked:bg-indigo-500 transition-all duration-200 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">Tekli Kayıt</span>
              </label>
              <div className="h-6 w-px bg-gray-300" />
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="radio"
                    name="mode"
                    checked={isBulkMode}
                    onChange={() => setIsBulkMode(true)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full peer-checked:border-emerald-500 peer-checked:bg-emerald-500 transition-all duration-200 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                </div>
                <Users className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-600 transition-colors">Çoklu Kayıt</span>
              </label>
            </div>

            {/* Single Mode Button */}
            {!isBulkMode && (
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] text-base font-semibold"
              >
                <Code className="h-5 w-5 mr-2" />
                Selenium Kodunu Oluştur
              </Button>
            )}

            {/* Bulk Mode Controls */}
            {isBulkMode && (
              <div className="space-y-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] text-base font-semibold"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Kayıt Ekle
                  {bulkRecords.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-sm">
                      {bulkRecords.length} kayıt
                    </span>
                  )}
                </Button>

                {bulkRecords.length > 0 && (
                  <>
                    {/* Progress Bar */}
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50 p-5">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-2xl" />
                      <div className="relative">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-emerald-800 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Eklenen Kayıtlar
                          </h4>
                          <button
                            type="button"
                            onClick={clearBulkRecords}
                            className="text-sm text-red-600 hover:text-red-800 transition-colors font-medium flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            Tümünü Temizle
                          </button>
                        </div>
                        
                        {/* Mini Progress */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-xs text-emerald-600 mb-1">
                            <span>{bulkRecords.length} kayıt eklendi</span>
                            <span>Hazır</span>
                          </div>
                          <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                              style={{ width: '100%' }}
                            />
                          </div>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                          {bulkRecords.map((record, index) => {
                            const studentName = excelData.Sinif_Sube?.find(s => s.value === record.sinifSube)?.text || record.sinifSube;
                            const serviceName = excelData.RPD_Hizmet_Turu?.find(s => s.value === record.rpdHizmetTuru)?.text || record.rpdHizmetTuru;
                            return (
                              <div 
                                key={index} 
                                className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-200 group"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                  </span>
                                  <div className="text-sm">
                                    <div className="font-medium text-gray-800">
                                      {studentName}
                                    </div>
                                    <div className="text-gray-500 text-xs">
                                      {serviceName} • {record.gorusmeTarihi}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeBulkRecord(index)}
                                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50 transition-all duration-200 p-2 rounded-lg"
                                  title="Kaydı Sil"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={handleBulkFinish}
                      className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] text-base font-semibold"
                    >
                      <FileCode className="h-5 w-5 mr-2" />
                      Toplu Selenium Kodunu Oluştur
                      <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-sm">
                        {bulkRecords.length} kayıt
                      </span>
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default MebbisRPDForm;
