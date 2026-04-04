// Okul Dışı Etkinlik Evrak Şablonları
// Resmi Yazışma Yönetmeliğine uygun formatlama

export interface OkulDisiEtkinlik {
  id: string;
  etkinlik_adi: string;
  etkinlik_tarihi: string;
  mekan: string;
  guzergah: string | null;
  cikis_saati: string | null;
  donus_saati: string | null;
  sure: string | null;
  ogretmen_adi: string;
  sinif_key: string;
  sinif_display: string;
  refakatci: string | null;
  arac_plaka: string | null;
  arac_sofor: string | null;
  arac_firma: string | null;
  arac_telefon: string | null;
  katilimci_sayisi: number;
  aciklama: string | null;
}

export interface SchoolSettings {
  school_name: string;
  school_principal: string;
  school_address: string;
  counselor_name: string;
  academic_year: string;
}

export interface StudentItem {
  value: string;
  text: string;
}

// ==================== YARDIMCI FONKSİYONLAR ====================

function formatTarih(dateStr: string): string {
  const months = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const days = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} ${days[d.getDay()]}`;
}

function formatTarihKisa(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${d.getFullYear()}`;
}

function s(val: string | null | undefined, fallback = '.....................'): string {
  return val && val.trim() ? val : fallback;
}

function studentName(student: StudentItem): string {
  return student.text.replace(/^\d+\s+/, '');
}

// Resmi Yazışma CSS - Yönetmeliğe uygun
const RESMI_CSS = `
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.15;
    color: #000;
    margin: 0;
    padding: 0;
  }
  .sayfa {
    width: 210mm;
    min-height: 297mm;
    padding: 15mm;
    box-sizing: border-box;
    position: relative;
  }
  .antet {
    text-align: center;
    margin-bottom: 0;
    line-height: 1.3;
  }
  .antet p {
    margin: 0;
    padding: 0;
  }
  .sayi-tarih {
    display: flex;
    justify-content: space-between;
    margin-top: 24pt;
  }
  .konu {
    margin-top: 0;
  }
  .muhatap {
    text-align: center;
    margin-top: 24pt;
    font-weight: bold;
  }
  .metin {
    text-align: justify;
    text-indent: 1.25cm;
    margin-top: 12pt;
    line-height: 1.15;
  }
  .metin-ilk {
    margin-top: 24pt;
  }
  .metin p, .metin-ilk p {
    text-indent: 1.25cm;
    margin: 0;
    text-align: justify;
  }
  .imza-tek {
    text-align: right;
    margin-top: 36pt;
    line-height: 1.3;
  }
  .imza-tek p { margin: 0; }
  .imza-cift {
    display: flex;
    justify-content: space-between;
    margin-top: 36pt;
  }
  .imza-cift .imza-sol, .imza-cift .imza-sag {
    text-align: center;
    width: 45%;
    line-height: 1.3;
  }
  .imza-cift p { margin: 0; }
  table {
    border-collapse: collapse;
    width: 100%;
  }
  td, th {
    border: 1px solid #000;
    padding: 6px 8px;
    font-size: 12pt;
    font-family: 'Times New Roman', Times, serif;
    vertical-align: top;
  }
  th {
    background: #f5f5f5;
    font-weight: bold;
  }
  .no-border td, .no-border th {
    border: none;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .ust-bosluk-2 { margin-top: 24pt; }
  .ust-bosluk-1 { margin-top: 12pt; }
  hr.kesik {
    border: none;
    border-top: 1px dashed #666;
    margin: 12pt 0;
  }
  .page-break { page-break-after: always; }
  .no-break { page-break-inside: avoid; }
  @media print {
    body { padding: 0; }
    .sayfa { padding: 15mm; }
    @page { size: A4; margin: 0; }
  }
`;

// Antet bloğu oluştur
function antet(schoolName: string): string {
  return `
    <div class="antet">
      <p><b>T.C.</b></p>
      <p><b>${schoolName.toUpperCase()}</b></p>
      <p>Müdürlüğü</p>
    </div>
  `;
}

// İki imzalı blok (alt unvan sol, üst unvan sağ)
function imzaCift(solAd: string, solUnvan: string, sagAd: string, sagUnvan: string): string {
  return `
    <div class="imza-cift no-break">
      <div class="imza-sol">
        <p>&nbsp;</p>
        <p>&nbsp;</p>
        <p><b>${solAd}</b></p>
        <p>${solUnvan}</p>
        <p style="margin-top: 4pt;">..... / ..... / 20....</p>
      </div>
      <div class="imza-sag">
        <p><b>UYGUNDUR</b></p>
        <p>&nbsp;</p>
        <p><b>${sagAd}</b></p>
        <p>${sagUnvan}</p>
        <p style="margin-top: 4pt;">..... / ..... / 20....</p>
      </div>
    </div>
  `;
}

// ==================== 1. VELİ İZİN DİLEKÇESİ ====================
export function generateVeliIzinDilekcesi(a: OkulDisiEtkinlik, settings: SchoolSettings, students: StudentItem[] = []): string {
  const tarih = formatTarih(a.etkinlik_tarihi);

  const makeKopya = (ogrenciAdi: string) => `
    <div class="no-break" style="padding: 8pt 0;">
      <div class="antet">
        <p><b>VELİ İZİN BELGESİ</b></p>
      </div>
      <p class="muhatap" style="margin-top: 12pt;">${settings.school_name.toUpperCase()} MÜDÜRLÜĞÜNE</p>
      <div class="metin-ilk" style="margin-top: 12pt;">
        <p>Velisi bulunduğum okulunuz ${a.sinif_display} şubesi öğrencisi <b>${ogrenciAdi}</b>'nın velisiyim. <b>${tarih}</b> günü ${s(a.cikis_saati, '.....')} - ${s(a.donus_saati, '.....')} saatleri arasında <b>${a.mekan}</b> adresinde yapılacak olan <b>${a.etkinlik_adi}</b> etkinliğine ${a.ogretmen_adi} öğretmen refakatinde katılmasına izin veriyorum.</p>
        <p style="margin-top: 6pt;">Gereğini arz ederim.</p>
      </div>
      <table class="no-border" style="margin-top: 18pt;">
        <tr>
          <td style="width: 50%; vertical-align: top; padding: 0;">
            <p style="margin: 2pt 0;">Adres: ..................................</p>
            <p style="margin: 2pt 0;">Telefon: ................................</p>
          </td>
          <td style="width: 50%; text-align: right; vertical-align: top; padding: 0;">
            <p style="margin: 2pt 0;">..... / ..... / 20....</p>
            <p style="margin: 12pt 0 2pt;">Veli Adı Soyadı</p>
            <p style="margin: 2pt 0;">İmza</p>
          </td>
        </tr>
      </table>
    </div>
    <hr class="kesik" />
  `;

  let html = '';
  if (students.length === 0) {
    html = makeKopya('…………………………') + makeKopya('…………………………') + makeKopya('…………………………') + makeKopya('………………��………');
  } else {
    students.forEach((st, i) => {
      html += makeKopya(studentName(st));
      if ((i + 1) % 4 === 0 && i < students.length - 1) {
        html += '<div class="page-break"></div>';
      }
    });
  }
  return html;
}

// ==================== 2. ARAÇ KİRALAMA SÖZLEŞMESİ ====================
export function generateAracSozlesmesi(a: OkulDisiEtkinlik, settings: SchoolSettings): string {
  const tarih = formatTarih(a.etkinlik_tarihi);
  const tarihKisa = formatTarihKisa(a.etkinlik_tarihi);

  return `
    ${antet(settings.school_name)}

    <p class="center bold ust-bosluk-2" style="font-size: 13pt;">OKUL DIŞI ETKİNLİK<br/>ARAÇ KİRALAMA SÖZLEŞMESİ</p>

    <div class="metin-ilk">
      <p><b>Madde 1 – TARAFLAR</b></p>
      <p>Bu sözleşme; bir tarafta <b>${settings.school_name.toUpperCase()}</b> Müdürlüğü (bundan sonra "İdare" olarak anılacaktır) ile diğer tarafta <b>${s(a.arac_firma)}</b> (bundan sonra "Yüklenici" olarak anılacaktır) arasında aşağıdaki şartlarla düzenlenmiştir.</p>

      <p style="margin-top: 12pt;"><b>Madde 2 – SÖZLEŞMENİN KONUSU</b></p>
      <p>Bu sözleşme, İdare'nin <b>${a.etkinlik_adi}</b> etkinliği kapsamında öğrenci ve personel taşıma hizmetinin yürütülmesine ilişkin usul ve esasları düzenler.</p>

      <p style="margin-top: 12pt;"><b>Madde 3 – ETKİNLİK BİLGİLERİ</b></p>
      <p>3.1. Gidilecek Yer: <b>${a.mekan}</b></p>
      <p>3.2. Tarih: <b>${tarih}</b>, Hareket Saati: <b>${s(a.cikis_saati, '.....')}</b>, Dönüş Saati: <b>${s(a.donus_saati, '.....')}</b></p>
      <p>3.3. Güzergâh: <b>${s(a.guzergah)}</b></p>

      <p style="margin-top: 12pt;"><b>Madde 4 – ARAÇ BİLGİLERİ</b></p>
      <p>Araç Plakası: <b>${s(a.arac_plaka)}</b> &nbsp;&nbsp; Şoför Adı Soyadı: <b>${s(a.arac_sofor)}</b> &nbsp;&nbsp; Şoför Telefonu: <b>${s(a.arac_telefon)}</b></p>

      <p style="margin-top: 12pt;"><b>Madde 5 – KATILIMCI SAYISI</b></p>
      <p>Taşınacak toplam kişi sayısı: <b>${a.katilimci_sayisi || '...'}</b> kişidir.</p>

      <p style="margin-top: 12pt;"><b>Madde 6 – SİGORTA</b></p>
      <p>Yüklenici, taşıma sırasında meydana gelebilecek kazalara karşı Zorunlu Koltuk Sigortası ve Kasko sigortası yaptırmış olmalıdır. Sigorta poliçelerinin birer örneği İdare'ye teslim edilecektir.</p>

      <p style="margin-top: 12pt;"><b>Madde 7 – ÜCRET</b></p>
      <p>Taşıma ücreti ..................... TL (..................... Türk Lirası) olup, etkinlik sonrasında ödenecektir.</p>

      <p style="margin-top: 12pt;"><b>Madde 8 – YÜKLENİCİNİN YÜKÜMLÜLÜKLERİ</b></p>
      <p>8.1. Şoför, etkinlik günü yeterli dinlenme süresini tamamlamış olmalıdır.</p>
      <p>8.2. Araç, teknik bakımı yapılmış ve trafiğe uygun durumda olmalıdır.</p>
      <p>8.3. Araçta ilk yardım çantası, yangın söndürücü ve reflektör bulundurulmalıdır.</p>
      <p>8.4. Şoför, belirtilen güzergâh dışına çıkmayacaktır.</p>
      <p>8.5. Tüm yolcuların emniyet kemerlerini takmaları sağlanacaktır.</p>

      <p style="margin-top: 12pt;"><b>Madde 9 – HIZ SINIRI</b></p>
      <p>Şehir içinde azami 50 km/s, şehir dışında azami 80 km/s hız ile seyredilecektir.</p>

      <p style="margin-top: 12pt;"><b>Madde 10 �� KAZA DURUMU</b></p>
      <p>Herhangi bir kaza veya arıza durumunda Yüklenici derhal İdare'yi bilgilendirecek ve yedek araç temin edecektir.</p>

      <p style="margin-top: 12pt;"><b>Madde 11 – GÜVENLİK EKİPMANLARI</b></p>
      <p>Araçta emniyet kemeri, ilk yardım çantası, yangın söndürücü, çekme halatı ve reflektör bulundurulması zorunludur.</p>

      <p style="margin-top: 12pt;"><b>Madde 12 – SORUMLULUK</b></p>
      <p>Yüklenicinin kusuru nedeniyle meydana gelen her türlü zarar ve ziyandan Yüklenici sorumludur.</p>

      <p style="margin-top: 12pt;"><b>Madde 13 – MÜCBİR SEBEPLER</b></p>
      <p>Doğal afet, savaş, salgın hastalık gibi mücbir sebep hâllerinde taraflar yükümlülüklerinden kurtulur.</p>

      <p style="margin-top: 12pt;"><b>Madde 14 – FESİH</b></p>
      <p>Taraflardan birinin yükümlülüklerini yerine getirmemesi hâlinde diğer taraf sözleşmeyi feshedebilir.</p>

      <p style="margin-top: 12pt;"><b>Madde 15 – YETKİLİ MAHKEME</b></p>
      <p>Uyuşmazlıklarda ..................... Mahkemeleri yetkilidir.</p>

      <p style="margin-top: 12pt;"><b>Madde 16 – YÜRÜRLÜK</b></p>
      <p>İşbu sözleşme ${tarihKisa} tarihinde 2 (iki) nüsha olarak düzenlenmiş olup, taraflarca okunarak imzalanmıştır.</p>
    </div>

    <div class="imza-cift no-break" style="margin-top: 48pt;">
      <div class="imza-sol">
        <p><b>İDARE</b></p>
        <p>&nbsp;</p>
        <p>&nbsp;</p>
        <p><b>${settings.school_principal || '.....................'}</b></p>
        <p>${settings.school_name} Müdürü</p>
        <p>İmza / Mühür</p>
      </div>
      <div class="imza-sag">
        <p><b>YÜKLENİCİ</b></p>
        <p>&nbsp;</p>
        <p>&nbsp;</p>
        <p><b>${s(a.arac_firma)}</b></p>
        <p>Firma Yetkilisi</p>
        <p>İmza / Kaşe</p>
      </div>
    </div>
  `;
}

// ==================== 3. SORUMLU ÖĞRETMENLER ====================
export function generateSorumluOgretmenler(a: OkulDisiEtkinlik, settings: SchoolSettings): string {
  let ogretmenRows = '';
  ogretmenRows += `<tr><td class="center">1</td><td>${a.ogretmen_adi}</td><td>Sınıf Öğretmeni</td><td>Sorumlu Öğretmen</td><td style="width: 80px;"></td></tr>`;
  for (let i = 2; i <= 6; i++) {
    ogretmenRows += `<tr><td class="center">${i}</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>`;
  }

  return `
    ${antet(settings.school_name)}

    <p class="center bold ust-bosluk-2">SORUMLU VE REHBER ÖĞRETMENLER LİSTESİ</p>
    <p class="center" style="margin-top: 6pt;">${a.etkinlik_adi} – ${formatTarih(a.etkinlik_tarihi)}</p>

    <table style="margin-top: 18pt;">
      <tr>
        <th style="width: 50px;">Sıra No</th>
        <th>Adı ve Soyadı</th>
        <th>Branşı</th>
        <th>Görevi</th>
        <th style="width: 80px;">İmzası</th>
      </tr>
      ${ogretmenRows}
    </table>

    <p class="center bold" style="margin-top: 24pt;">ARAÇ VE FİRMA BİLGİLERİ</p>
    <table style="margin-top: 12pt;">
      <tr><td style="width: 180px;" class="bold">Firma / Acente Adı</td><td>${s(a.arac_firma)}</td></tr>
      <tr><td class="bold">Şoför Adı Soyadı</td><td>${s(a.arac_sofor)}</td></tr>
      <tr><td class="bold">Araç Plakası</td><td>${s(a.arac_plaka)}</td></tr>
      <tr><td class="bold">Telefon</td><td>${s(a.arac_telefon)}</td></tr>
    </table>

    ${imzaCift(a.ogretmen_adi, 'Sorumlu Ö��retmen', settings.school_principal || '.....................', 'Okul Müdürü')}
  `;
}

// ==================== 4. KATILIMCI LİSTESİ ====================
export function generateKatilimciListesi(a: OkulDisiEtkinlik, settings: SchoolSettings, students: StudentItem[] = []): string {
  const totalRows = Math.max(30, students.length);
  let rows = '';
  for (let i = 1; i <= totalRows; i++) {
    const st = students[i - 1];
    const name = st ? studentName(st) : '&nbsp;';
    const tc = st ? st.value : '&nbsp;';
    const unvan = st ? 'Öğrenci' : '&nbsp;';
    rows += `<tr><td class="center" style="width: 40px;">${i}</td><td style="width: 90px;">${unvan}</td><td>${name}</td><td style="width: 130px;">${tc}</td></tr>`;
  }

  return `
    ${antet(settings.school_name)}

    <p class="center ust-bosluk-1" style="line-height: 1.4;">
      <b>${formatTarih(a.etkinlik_tarihi)}</b> tarihinde
      <b>${s(a.cikis_saati, '.....')}</b> – <b>${s(a.donus_saati, '.....')}</b> saatleri arasında<br/>
      <b>${a.mekan}</b> (<b>${a.etkinlik_adi}</b>) gezisine
    </p>

    <p class="center bold" style="margin-top: 12pt; font-size: 13pt;">KATILACAKLARIN LİSTESİ</p>

    <table style="margin-top: 12pt;">
      <tr>
        <th style="width: 40px;">SIRA NO</th>
        <th style="width: 90px;">ÜNVANI</th>
        <th>ADI SOYADI</th>
        <th style="width: 130px;">T.C. KİMLİK NO</th>
      </tr>
      ${rows}
    </table>

    <div class="imza-tek no-break" style="margin-top: 24pt;">
      <p><b>${a.ogretmen_adi}</b></p>
      <p>Sorumlu Öğretmen</p>
    </div>
  `;
}

// ==================== 5. OKUL İZİN DİLEKÇESİ (EK-5) ====================
export function generateOkulIzinDilekcesi(a: OkulDisiEtkinlik, settings: SchoolSettings): string {
  return `
    ${antet(settings.school_name)}

    <div class="sayi-tarih">
      <div>Sayı : .......................</div>
      <div>${formatTarihKisa(a.etkinlik_tarihi)}</div>
    </div>
    <div class="konu">Konu : Okul Dışı Etkinlik İzni</div>

    <p class="muhatap" style="margin-top: 24pt;">${settings.school_name.toUpperCase()} MÜDÜRLÜĞÜNE</p>

    <div class="metin-ilk">
      <p>Okulumuz <b>${a.sinif_display}</b> şubesi öğrencilerinin <b>${formatTarih(a.etkinlik_tarihi)}</b> tarihinde <b>${s(a.cikis_saati, '.....')}</b> – <b>${s(a.donus_saati, '.....')}</b> saatleri arasında <b>${a.mekan}</b> adresine yapılacak <b>${a.etkinlik_adi}</b> etkinliğine katılmalarını ve <b>${a.ogretmen_adi}</b> öğretmen refakatinde gönderilmesini arz ederim.</p>
    </div>

    ${imzaCift(a.ogretmen_adi, 'Sorumlu Öğretmen', settings.school_principal || '.....................', 'Okul Müdürü')}

    <p class="center bold" style="margin-top: 12pt;">Ek:</p>
    <p style="margin-left: 1.25cm;">1- Veli İzin Belgeleri</p>
    <p style="margin-left: 1.25cm;">2- Katılımcı Listesi</p>
    <p style="margin-left: 1.25cm;">3- Gezi Planı (EK-6)</p>
  `;
}

// ==================== 6. GEZİ PLANI (EK-6) ====================
export function generateGeziPlani(a: OkulDisiEtkinlik, settings: SchoolSettings): string {
  const row = (label: string, value: string) =>
    `<tr><td style="width: 180px; background: #f9f9f9;" class="bold">${label}</td><td>${value}</td></tr>`;

  return `
    ${antet(settings.school_name)}

    <p class="center bold ust-bosluk-2" style="font-size: 13pt;">EK-6</p>
    <p class="center bold" style="font-size: 13pt;">OKUL DIŞI ÖĞRETİM ETKİNLİĞİ PLANI</p>

    <table style="margin-top: 18pt;">
      ${row('Etkinliğin Adı', a.etkinlik_adi)}
      ${row('Gidilecek Yer', a.mekan)}
      ${row('Sınıf / Şube', a.sinif_display)}
      ${row('Etkinlik Tarihi', formatTarih(a.etkinlik_tarihi))}
      ${row('Çıkış Saati', s(a.cikis_saati, '...'))}
      ${row('Dönüş Saati', s(a.donus_saati, '...'))}
      ${row('Etkinlik Süresi', s(a.sure, '...'))}
      ${row('Etkinlik Sorumlusu', a.ogretmen_adi)}
      ${row('Refakatçiler', s(a.refakatci, '...'))}
      ${row('Ulaşım Aracı', a.arac_plaka ? `Araç Plaka: ${a.arac_plaka}` : '...')}
      ${row('Güzergâh', s(a.guzergah, '...'))}
      ${row('Katılımcı Sayısı', a.katilimci_sayisi ? String(a.katilimci_sayisi) : '...')}
      ${row('Açıklama', s(a.aciklama, '...'))}
      ${row('Etkinliğin Amacı', '&nbsp;<br/>&nbsp;<br/>&nbsp;')}
      ${row('Yapılacak Etkinlikler', '&nbsp;<br/>&nbsp;<br/>&nbsp;')}
      ${row('Alınacak Güvenlik Önlemleri', '&nbsp;<br/>&nbsp;<br/>&nbsp;')}
    </table>

    ${imzaCift(a.ogretmen_adi, 'Sorumlu Öğretmen', settings.school_principal || '.....................', 'Okul Müdürü')}
  `;
}

// ==================== ORTAK CSS EXPORT ====================
export function getResmiCss(): string {
  return RESMI_CSS;
}
