"use client";

import React, { useState } from 'react';
import { Upload, File, CheckCircle, AlertCircle } from 'lucide-react';
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

      onDataLoaded(excelData);
      setIsLoading(false);

    } catch (error) {
      console.error('Excel dosyası okunurken hata oluştu:', error);
      alert('Excel dosyası okunurken bir hata oluştu. Lütfen dosya formatını kontrol ediniz.');
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <File className="h-5 w-5" />
          Veri Kaynağı Seçimi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Embedded Data Option */}
        {isEmbeddedDataAvailable && onUseEmbeddedData && (
          <>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-3 h-6 w-6" />
                  <div>
                    <h3 className="text-lg font-medium text-green-800">
                      Gömülü Veriler Kullanılabilir
                    </h3>
                    <p className="text-sm text-green-600">
                      Uygulama içinde tanımlanmış veri seti mevcut. Hemen kullanmaya başlayabilirsiniz.
                    </p>
                  </div>
                </div>
                <Button onClick={onUseEmbeddedData} className="bg-green-600 hover:bg-green-700">
                  Varsayılan Verileri Kullan
                </Button>
              </div>
            </div>

            <div className="flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500">veya</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
          </>
        )}

        {/* Custom Excel Upload */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">
            Özel Excel Dosyası Yükle
          </h3>
          {!isDataLoaded ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto mb-4 text-gray-400 h-12 w-12" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                {isLoading ? 'Dosya işleniyor...' : 'Excel dosyasını buraya sürükleyin'}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                veya dosya seçmek için tıklayın
              </p>
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
                <Button asChild disabled={isLoading}>
                  <span>
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Yükleniyor...
                      </>
                    ) : (
                      'Dosya Seç'
                    )}
                  </span>
                </Button>
              </label>
              {fileName && (
                <p className="mt-2 text-sm text-gray-600">
                  Seçilen dosya: {fileName}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 bg-green-50 rounded-lg">
              <CheckCircle className="text-green-500 mr-3 h-6 w-6" />
              <div>
                <p className="text-lg font-medium text-green-700">
                  Özel Excel dosyası başarıyla yüklendi
                </p>
                <p className="text-sm text-green-600">
                  Veri eşleştirmeleri hazır. Artık form doldurabilirsiniz.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="text-blue-500 mr-2 mt-0.5 flex-shrink-0 h-4 w-4" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Excel dosyası formatı:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Her sayfa farklı bir veri türü için (örn: Sinif_Sube, Ogrenci_Ana_Sinifi_A_Subesi, RPD_Hizmet_Turu)</li>
                <li>Her sayfada &quot;Değer&quot; ve &quot;Metin&quot; kolonları bulunmalı</li>
                <li>Değer kolonu sistem kodlarını (örn: 22602658#0), Metin kolonu Türkçe metinleri içermeli</li>
                <li>Sistem arka planda değer kodlarını kullanarak Türkçe karakter sorununu önler</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MebbisExcelUpload;
