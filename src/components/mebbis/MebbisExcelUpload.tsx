"use client";

import React, { useState } from 'react';
import { Upload, File, CheckCircle, AlertCircle, Sparkles, FileSpreadsheet, CloudUpload, Database } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MebbisExcelData } from '@/types/mebbis';

interface MebbisExcelUploadProps {
  onDataLoaded: (data: MebbisExcelData) => void;
  isDataLoaded: boolean;
  isEmbeddedDataAvailable?: boolean;
  onUseEmbeddedData?: () => void;
}

const MebbisExcelUpload: React.FC<MebbisExcelUploadProps> = ({
  onDataLoaded,
  isDataLoaded,
  isEmbeddedDataAvailable = false,
  onUseEmbeddedData
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!file || !file.name.endsWith('.xlsx')) {
      alert('Lütfen .xlsx uzantılı bir Excel dosyası seçiniz.');
      return;
    }

    setIsLoading(true);
    setFileName(file.name);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 100);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      const excelData: MebbisExcelData = {};

      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length > 1) {
          const headers = jsonData[0] as string[];
          const valueIndex = headers.findIndex(h =>
            h && h.toLowerCase().includes('değer') || h && h.toLowerCase().includes('value')
          );
          const textIndex = headers.findIndex(h =>
            h && h.toLowerCase().includes('metin') || h && h.toLowerCase().includes('text')
          );

          if (valueIndex !== -1 && textIndex !== -1) {
            excelData[sheetName] = [];

            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i] as (string | number)[];
              const value = row[valueIndex];
              const text = row[textIndex];

              if (value && text) {
                excelData[sheetName].push({
                  value: String(value).trim(),
                  text: String(text).trim()
                });
              }
            }
          } else {
            excelData[sheetName] = [];
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i] as (string | number)[];
              if (row[0] && row[1]) {
                excelData[sheetName].push({
                  value: String(row[0]).trim(),
                  text: String(row[1]).trim()
                });
              }
            }
          }
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        onDataLoaded(excelData);
        setIsLoading(false);
      }, 300);

    } catch (error) {
      clearInterval(progressInterval);
      console.error('Excel dosyası okunurken hata oluştu:', error);
      alert('Excel dosyası okunurken bir hata oluştu. Lütfen dosya formatını kontrol ediniz.');
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
      <CardHeader className="relative overflow-hidden pb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-purple-500/10" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sky-400/20 to-indigo-400/20 rounded-full blur-2xl" />
        <CardTitle className="relative flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl shadow-lg">
            <Database className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Veri Kaynağı Seçimi
            </span>
            <p className="text-sm font-normal text-gray-500 mt-0.5">Gömülü veriler veya özel Excel dosyası kullanın</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* Embedded Data Option */}
        {isEmbeddedDataAvailable && onUseEmbeddedData && (
          <>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200/50 p-5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-2xl" />
              <div className="relative flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-400 rounded-xl blur-md opacity-40 animate-pulse" />
                    <div className="relative p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-emerald-800 flex items-center gap-2">
                      Gömülü Veriler Hazır
                      <span className="px-2 py-0.5 text-xs bg-emerald-200 text-emerald-700 rounded-full font-medium">ÖNERİLEN</span>
                    </h3>
                    <p className="text-sm text-emerald-600">
                      Uygulama içinde tanımlanmış veri seti mevcut. Tek tıkla başlayın!
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={onUseEmbeddedData} 
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Hemen Başla
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              <span className="px-4 py-1 text-sm text-gray-500 bg-gray-100 rounded-full font-medium">veya</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            </div>
          </>
        )}

        {/* Custom Excel Upload */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-indigo-500" />
            Özel Excel Dosyası Yükle
          </h3>
          {!isDataLoaded ? (
            <div
              className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                isDragging
                  ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 scale-[1.02]'
                  : 'border-gray-300 hover:border-indigo-400 hover:bg-gradient-to-br hover:from-gray-50 hover:to-indigo-50/30'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
              </div>
              
              <div className="relative">
                <div className={`mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isDragging 
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg scale-110' 
                    : 'bg-gradient-to-br from-gray-100 to-gray-200'
                }`}>
                  <CloudUpload className={`h-8 w-8 transition-colors duration-300 ${
                    isDragging ? 'text-white' : 'text-gray-400'
                  }`} />
                </div>
                
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  {isLoading ? 'Dosya işleniyor...' : isDragging ? 'Dosyayı bırakın!' : 'Excel dosyasını buraya sürükleyin'}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  veya dosya seçmek için tıklayın
                </p>

                {/* Progress Bar */}
                {isLoading && (
                  <div className="mb-4">
                    <div className="w-full max-w-xs mx-auto h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{uploadProgress}% tamamlandı</p>
                  </div>
                )}

                <input
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  id="mebbis-file-upload"
                  disabled={isLoading}
                />
                <label htmlFor="mebbis-file-upload">
                  <Button asChild disabled={isLoading} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
                    <span>
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Yükleniyor...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Dosya Seç
                        </>
                      )}
                    </span>
                  </Button>
                </label>
                {fileName && !isLoading && (
                  <p className="mt-3 text-sm text-gray-600 flex items-center justify-center gap-2">
                    <File className="h-4 w-4 text-indigo-500" />
                    {fileName}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border border-emerald-200/50 p-6">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-green-400/20 rounded-full blur-2xl" />
              <div className="relative flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-emerald-800">
                    Excel dosyası başarıyla yüklendi!
                  </p>
                  <p className="text-sm text-emerald-600">
                    Veri eşleştirmeleri hazır. Artık form doldurabilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 border border-sky-200/50 p-5">
          <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-sky-400/20 to-blue-400/20 rounded-full blur-2xl" />
          <div className="relative flex items-start gap-3">
            <div className="p-2 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg shadow-md flex-shrink-0">
              <AlertCircle className="h-4 w-4 text-white" />
            </div>
            <div className="text-sm text-sky-800">
              <p className="font-semibold mb-2">Excel dosyası formatı:</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-1.5 flex-shrink-0" />
                  Her sayfa farklı bir veri türü için (örn: Sinif_Sube, Ogrenci_Ana_Sinifi_A_Subesi)
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-1.5 flex-shrink-0" />
                  Her sayfada &quot;Değer&quot; ve &quot;Metin&quot; kolonları bulunmalı
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-1.5 flex-shrink-0" />
                  Sistem arka planda değer kodlarını kullanarak Türkçe karakter sorununu önler
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MebbisExcelUpload;
