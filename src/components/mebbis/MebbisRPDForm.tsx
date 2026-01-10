"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Save, Code, Plus, Trash2, Users, FileCode } from 'lucide-react';
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
        <Label className="flex items-center gap-2">
          {icon}
          {label}
        </Label>
        <select
          value={formData[field]}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            errors[field] ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <option value="">Seçiniz...</option>
          {options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.text}
            </option>
          ))}
        </select>
        {formData[field] && (
          <p className="text-xs text-gray-500">
            Sistem değeri: <code className="bg-gray-100 px-1 rounded">{formData[field]}</code>
          </p>
        )}
        {errors[field] && (
          <p className="text-sm text-red-600">{errors[field]}</p>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="h-5 w-5" />
          RPD Form Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {renderSelect(
                'Sınıf / Şube',
                'sinifSube',
                'Sinif_Sube',
                <Calendar className="h-4 w-4" />
              )}

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Öğrenci
                </Label>
                <select
                  key={formData.sinifSube}
                  value={formData.ogrenci}
                  onChange={(e) => handleInputChange('ogrenci', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.ogrenci ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  disabled={!formData.sinifSube}
                >
                  <option value="">
                    {!formData.sinifSube ? 'Önce şube seçiniz...' : 'Seçiniz...'}
                  </option>
                  {getStudentList().map((option, index) => (
                    <option key={index} value={option.value}>
                      {option.text}
                    </option>
                  ))}
                </select>
                {formData.ogrenci && (
                  <p className="text-xs text-gray-500">
                    Sistem değeri: <code className="bg-gray-100 px-1 rounded">{formData.ogrenci}</code>
                  </p>
                )}
                {errors.ogrenci && (
                  <p className="text-sm text-red-600">{errors.ogrenci}</p>
                )}
              </div>

              {renderSelect(
                'RPD Hizmet Türü',
                'rpdHizmetTuru',
                'RPD_Hizmet_Turu',
                <Calendar className="h-4 w-4" />
              )}

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  1. Aşama
                </Label>
                <select
                  value={formData.asama1}
                  onChange={(e) => handleInputChange('asama1', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.asama1 ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  disabled={!formData.rpdHizmetTuru || !rpdStageData}
                >
                  <option value="">
                    {!formData.rpdHizmetTuru ? 'Önce RPD Hizmet Türü seçiniz...' :
                     !rpdStageData ? 'Aşama verileri yükleniyor...' : 'Seçiniz...'}
                  </option>
                  {getStage1List().map((option, index) => (
                    <option key={index} value={option.value}>
                      {option.text}
                    </option>
                  ))}
                </select>
                {formData.asama1 && (
                  <p className="text-xs text-gray-500">
                    Sistem değeri: <code className="bg-gray-100 px-1 rounded">{formData.asama1}</code>
                  </p>
                )}
                {errors.asama1 && (
                  <p className="text-sm text-red-600">{errors.asama1}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  2. Aşama
                </Label>
                <select
                  value={formData.asama2}
                  onChange={(e) => handleInputChange('asama2', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.asama2 ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  disabled={!formData.asama1 || !rpdStageData}
                >
                  <option value="">
                    {!formData.asama1 ? 'Önce 1. Aşama seçiniz...' :
                     !rpdStageData ? 'Aşama verileri yükleniyor...' : 'Seçiniz...'}
                  </option>
                  {getStage2List().map((option, index) => (
                    <option key={index} value={option.value}>
                      {option.text}
                    </option>
                  ))}
                </select>
                {formData.asama2 && (
                  <p className="text-xs text-gray-500">
                    Sistem değeri: <code className="bg-gray-100 px-1 rounded">{formData.asama2}</code>
                  </p>
                )}
                {errors.asama2 && (
                  <p className="text-sm text-red-600">{errors.asama2}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  3. Aşama
                  {formData.asama1 !== '18' && formData.asama2 && (
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                      (Opsiyonel)
                    </span>
                  )}
                  {formData.asama1 === '18' && (
                    <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded">
                      (Zorunlu)
                    </span>
                  )}
                </Label>
                <select
                  value={formData.asama3}
                  onChange={(e) => handleInputChange('asama3', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.asama3 ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  disabled={!formData.asama2 || !rpdStageData}
                >
                  <option value="">
                    {!formData.asama2 ? 'Önce 2. Aşama seçiniz...' :
                     !rpdStageData ? 'Aşama verileri yükleniyor...' :
                     formData.asama1 !== '18' ? 'Seçiniz... (opsiyonel)' : 'Seçiniz...'}
                  </option>
                  {getStage3List().map((option, index) => (
                    <option key={index} value={option.value}>
                      {option.text}
                    </option>
                  ))}
                </select>
                {formData.asama3 && (
                  <p className="text-xs text-gray-500">
                    Sistem değeri: <code className="bg-gray-100 px-1 rounded">{formData.asama3}</code>
                  </p>
                )}
                {errors.asama3 && (
                  <p className="text-sm text-red-600">{errors.asama3}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Görüşme Tarihi
                </Label>
                <Input
                  type="date"
                  value={formData.gorusmeTarihi}
                  onChange={(e) => handleInputChange('gorusmeTarihi', e.target.value)}
                  className={errors.gorusmeTarihi ? 'border-red-500 bg-red-50' : ''}
                />
                {errors.gorusmeTarihi && (
                  <p className="text-sm text-red-600">{errors.gorusmeTarihi}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Başlama Saati
                  </Label>
                  <Input
                    type="time"
                    value={formData.gorusmeBaslamaSaati}
                    onChange={(e) => handleInputChange('gorusmeBaslamaSaati', e.target.value)}
                    className={errors.gorusmeBaslamaSaati ? 'border-red-500 bg-red-50' : ''}
                  />
                  {errors.gorusmeBaslamaSaati && (
                    <p className="text-sm text-red-600">{errors.gorusmeBaslamaSaati}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Bitiş Saati
                  </Label>
                  <Input
                    type="time"
                    value={formData.gorusmeBitisSaati}
                    onChange={(e) => handleInputChange('gorusmeBitisSaati', e.target.value)}
                    className={errors.gorusmeBitisSaati ? 'border-red-500 bg-red-50' : ''}
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
                <MapPin className="h-4 w-4" />
              )}
            </div>
          </div>

          <div className="pt-4 border-t space-y-4">
            {/* Mode Toggle */}
            <div className="flex items-center justify-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  checked={!isBulkMode}
                  onChange={() => {
                    setIsBulkMode(false);
                    setBulkRecords([]);
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">Tekli Kayıt</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  checked={isBulkMode}
                  onChange={() => setIsBulkMode(true)}
                  className="w-4 h-4"
                />
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium text-gray-700">Çoklu Kayıt</span>
              </label>
            </div>

            {/* Single Mode Button */}
            {!isBulkMode && (
              <Button type="submit" className="w-full">
                <Code className="h-4 w-4 mr-2" />
                Selenium Kodunu Oluştur
              </Button>
            )}

            {/* Bulk Mode Controls */}
            {isBulkMode && (
              <div className="space-y-4">
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Kayıt Ekle ({bulkRecords.length} kayıt)
                </Button>

                {bulkRecords.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-800">Eklenen Kayıtlar ({bulkRecords.length})</h4>
                      <button
                        type="button"
                        onClick={clearBulkRecords}
                        className="text-sm text-red-600 hover:text-red-800 transition-colors"
                      >
                        Tümünü Temizle
                      </button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {bulkRecords.map((record, index) => {
                        const studentName = excelData.Sinif_Sube?.find(s => s.value === record.sinifSube)?.text || record.sinifSube;
                        const serviceName = excelData.RPD_Hizmet_Turu?.find(s => s.value === record.rpdHizmetTuru)?.text || record.rpdHizmetTuru;
                        return (
                          <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                            <div className="text-sm">
                              <div className="font-medium text-gray-800">
                                {studentName}
                              </div>
                              <div className="text-gray-600">
                                {serviceName} • {record.gorusmeTarihi}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeBulkRecord(index)}
                              className="text-red-500 hover:text-red-700 transition-colors p-1"
                              title="Kaydı Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {bulkRecords.length > 0 && (
                  <Button
                    type="button"
                    onClick={handleBulkFinish}
                    className="w-full"
                  >
                    <FileCode className="h-4 w-4 mr-2" />
                    Toplu Selenium Kodunu Oluştur ({bulkRecords.length} kayıt)
                  </Button>
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
