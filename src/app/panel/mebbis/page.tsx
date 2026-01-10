"use client";

import React, { useState, useEffect } from 'react';
import { Bot, FileText, Settings, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MebbisExcelUpload from '@/components/mebbis/MebbisExcelUpload';
import MebbisRPDForm from '@/components/mebbis/MebbisRPDForm';
import MebbisScriptGenerator from '@/components/mebbis/MebbisScriptGenerator';
import type { MebbisExcelData, MebbisFormData, MebbisBulkFormData } from '@/types/mebbis';

type CurrentStep = 'upload' | 'form' | 'script';

interface EmbeddedData {
  [key: string]: Array<{ value: string; text: string }>;
}

export default function MebbisPage() {
  const [excelData, setExcelData] = useState<MebbisExcelData>({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<MebbisFormData | null>(null);
  const [bulkData, setBulkData] = useState<MebbisBulkFormData>({ records: [], isBulkMode: false });
  const [currentStep, setCurrentStep] = useState<CurrentStep>('upload');
  const [isEmbeddedData, setIsEmbeddedData] = useState(true);

  // Load embedded data on component mount
  useEffect(() => {
    loadEmbeddedData();
  }, []);

  const loadEmbeddedData = async () => {
    try {
      const response = await fetch('/mebbis-data.json');
      const embeddedData: EmbeddedData = await response.json();
      
      const formattedData: MebbisExcelData = {};
      Object.keys(embeddedData).forEach(key => {
        if (Array.isArray(embeddedData[key])) {
          formattedData[key] = embeddedData[key];
        }
      });

      setExcelData(formattedData);
      setIsDataLoaded(true);
      setIsEmbeddedData(true);
      setCurrentStep('form');
    } catch (error) {
      console.error('Gömülü veriler yüklenemedi:', error);
    }
  };

  const handleDataLoaded = (data: MebbisExcelData) => {
    setExcelData(data);
    setIsDataLoaded(true);
    setIsEmbeddedData(false);
    setCurrentStep('form');
  };

  const switchToUpload = () => {
    setCurrentStep('upload');
    setIsEmbeddedData(false);
  };

  const handleGenerateScript = (formData: MebbisFormData) => {
    setGeneratedScript(formData);
    setBulkData({ records: [], isBulkMode: false });
    setCurrentStep('script');
  };

  const handleBulkGenerateScript = (bulkFormData: MebbisBulkFormData) => {
    setBulkData(bulkFormData);
    setGeneratedScript(null);
    setCurrentStep('script');
  };

  const resetProcess = () => {
    loadEmbeddedData();
    setBulkData({ records: [], isBulkMode: false });
    setGeneratedScript(null);
  };

  const goBackToForm = () => {
    setCurrentStep('form');
    setGeneratedScript(null);
    setBulkData({ records: [], isBulkMode: false });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-100 rounded-lg">
            <Bot className="h-6 w-6 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">MEBBİS Entegrasyonu</h1>
            <p className="text-sm text-gray-600">MEB RPD Sistemi için Selenium Otomasyon Aracı</p>
          </div>
        </div>

        {isDataLoaded && (
          <div className="flex items-center gap-2">
            {!isEmbeddedData && (
              <Button variant="outline" onClick={resetProcess}>
                <Settings className="h-4 w-4 mr-2" />
                Varsayılan Verilere Dön
              </Button>
            )}
            <Button variant="outline" onClick={switchToUpload}>
              <FileText className="h-4 w-4 mr-2" />
              Excel Yükle
            </Button>
            {currentStep === 'script' && (
              <Button variant="outline" onClick={goBackToForm}>
                Forma Dön
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-4">
          {/* Step 1 */}
          <div className={`flex items-center gap-2 ${currentStep === 'upload' ? 'text-blue-600' : isDataLoaded ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
              currentStep === 'upload' ? 'border-blue-600 bg-blue-50' :
              isDataLoaded ? 'border-green-600 bg-green-50' : 'border-gray-300 bg-gray-50'
            }`}>
              {isDataLoaded && currentStep !== 'upload' ? <CheckCircle className="h-4 w-4" /> : '1'}
            </div>
            <span className="text-sm font-medium hidden sm:inline">Excel Yükleme</span>
          </div>

          {/* Arrow */}
          <div className={`w-8 h-0.5 ${isDataLoaded ? 'bg-green-300' : 'bg-gray-300'}`}></div>

          {/* Step 2 */}
          <div className={`flex items-center gap-2 ${currentStep === 'form' ? 'text-blue-600' : (generatedScript || bulkData.isBulkMode) ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
              currentStep === 'form' ? 'border-blue-600 bg-blue-50' :
              (generatedScript || bulkData.isBulkMode) ? 'border-green-600 bg-green-50' : 'border-gray-300 bg-gray-50'
            }`}>
              {(generatedScript || bulkData.isBulkMode) && currentStep === 'script' ? <CheckCircle className="h-4 w-4" /> : '2'}
            </div>
            <span className="text-sm font-medium hidden sm:inline">Form Doldurma</span>
          </div>

          {/* Arrow */}
          <div className={`w-8 h-0.5 ${(generatedScript || bulkData.isBulkMode) ? 'bg-green-300' : 'bg-gray-300'}`}></div>

          {/* Step 3 */}
          <div className={`flex items-center gap-2 ${currentStep === 'script' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
              currentStep === 'script' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-gray-50'
            }`}>
              3
            </div>
            <span className="text-sm font-medium hidden sm:inline">Kod Oluşturma</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto">
        {currentStep === 'upload' && (
          <MebbisExcelUpload
            onDataLoaded={handleDataLoaded}
            isDataLoaded={false}
            isEmbeddedDataAvailable={true}
            onUseEmbeddedData={loadEmbeddedData}
          />
        )}

        {currentStep === 'form' && isDataLoaded && (
          <MebbisRPDForm
            excelData={excelData}
            onGenerateScript={handleGenerateScript}
            onBulkGenerateScript={handleBulkGenerateScript}
          />
        )}

        {currentStep === 'script' && (generatedScript || bulkData.isBulkMode) && (
          <MebbisScriptGenerator
            formData={generatedScript}
            bulkData={bulkData.isBulkMode ? bulkData : undefined}
          />
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center text-sm text-gray-600 mt-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FileText className="h-4 w-4" />
          <span>RPD Automation Tool - Excel Tabanlı MEB Sistemi Entegrasyonu</span>
        </div>
        <p>Bu araç, Excel verilerini kullanarak MEB RPD sistemindeki form doldurma işlemlerini otomatikleştirmek için tasarlanmıştır.</p>
        <p className="text-xs mt-1">Sistem değer kodlarını kullanarak Türkçe karakter sorunlarını önler.</p>
      </div>
    </div>
  );
}
