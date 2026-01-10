// MEBBİS Entegrasyon Tip Tanımları

export interface MebbisExcelData {
  [sheetName: string]: Array<{ value: string; text: string }>;
}

export interface MebbisFormData {
  sinifSube: string;
  ogrenci: string;
  rpdHizmetTuru: string;
  asama1: string;
  asama2: string;
  asama3: string;
  gorusmeTarihi: string;
  gorusmeBaslamaSaati: string;
  gorusmeBitisSaati: string;
  calismaYeri: string;
}

export interface MebbisBulkFormData {
  records: MebbisFormData[];
  isBulkMode: boolean;
}

export interface RpdStageOption {
  deger: string;
  metin: string;
}

export interface RpdStage1Data {
  secenekler: RpdStageOption[];
  toplam: number;
}

export interface RpdStage2Dependency {
  asama_1_deger: string;
  secenekler: RpdStageOption[];
  toplam: number;
}

export interface RpdStage3Dependency {
  asama_1_deger: string;
  asama_2_deger: string;
  secenekler: RpdStageOption[];
  toplam: number;
}

export interface RpdServiceData {
  hizmet_adi: string;
  asama_1: RpdStage1Data;
  asama_2_bagimliliklari: {
    [stage1Name: string]: RpdStage2Dependency;
  };
  asama_3_bagimliliklari: {
    [combinedName: string]: RpdStage3Dependency;
  };
}

export interface RpdStageData {
  metadata: {
    generated_at: string;
    total_services: number;
  };
  services: {
    [serviceCode: string]: RpdServiceData;
  };
}

export interface SelectOption {
  value: string;
  text: string;
}
