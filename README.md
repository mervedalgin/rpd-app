# 🎓 RPD Öğrenci Yönlendirme Sistemi

Modern, kullanıcı dostu bir web uygulaması ile öğrencilerin rehberlik servisine yönlendirilmesi sürecini dijitalleştiren sistem.

## 🌟 Özellikler

### 📝 **Form Yönetimi**
- **Akıllı öğretmen seçimi** - Öğretmen seçildiğinde sınıf otomatik doldurulur
- **Dinamik öğrenci listesi** - Sınıfa göre öğrenci listesi güncellenir
- **Çoklu yönlendirme nedeni** - Birden fazla neden seçilebilir
- **Form validasyonu** - Zod ile güçlü tip kontrolü

### 🎨 **Modern UI/UX**
- **Glassmorphism tasarım** - Modern cam efekti ile şık görünüm
- **Animasyonlu geçişler** - Smooth hover ve loading animasyonları
- **Responsive tasarım** - Mobil uyumlu arayüz
- **Sticky butonlar** - Mobilde kolay erişim için yapışkan butonlar
- **Dark/Light tema desteği** - Kullanıcı tercihi

### 📱 **Mobil Optimizasyon**
- **Touch-friendly** - Dokunmatik cihazlar için optimize edilmiş
- **Responsive dropdowns** - Eşit genişlik ve yükseklik
- **Loading states** - Kullanıcı deneyimi için yükleme göstergeleri
- **Error handling** - Hata durumları için güvenli fallback'ler

### 🔗 **Entegrasyonlar**
- **Google Sheets API** - Öğrenci verilerini Google Sheets'ten çeker
- **Telegram Bot** - Yönlendirilen öğrenci bilgilerini otomatik gönderim
- **JSON Cache** - Öğretmen verilerini hızlı erişim için önbellek

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18+ 
- npm, yarn, pnpm veya bun
- Google Sheets API erişimi
- Telegram Bot Token

### Kurulum

1. **Repository'yi klonlayın**
```bash
git clone https://github.com/yourusername/rpd-app.git
cd rpd-app
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
# veya
yarn install
# veya  
pnpm install
```

3. **Çevre değişkenlerini ayarlayın**
```bash
cp .env.example .env.local
```

`.env.local` dosyasını düzenleyin:
```env
# Google Sheets API
GOOGLE_SHEETS_API_KEY=your_api_key_here
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here  
TELEGRAM_CHAT_ID=your_chat_id_here
```

4. **Geliştirme sunucusunu başlatın**
```bash
npm run dev
```

5. **Uygulamayı açın**
[http://localhost:3000](http://localhost:3000) adresine gidin

## 📂 Proje Yapısı

```
rpd-app/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API endpoints
│   │   │   ├── data/       # Veri API'si
│   │   │   ├── students/   # Öğrenci API'si
│   │   │   └── teachers/   # Öğretmen API'si
│   │   ├── globals.css     # Global stiller
│   │   ├── layout.tsx      # Ana layout
│   │   └── page.tsx        # Ana sayfa
│   ├── components/         # React componentleri
│   │   ├── ui/            # Shadcn/ui componentleri
│   │   └── RPDYonlendirme.tsx # Ana form component
│   ├── lib/               # Utility fonksiyonları
│   └── types/             # TypeScript tip tanımları
├── var/                   # Veri dosyaları
│   └── teachers.json      # Öğretmen cache
├── public/               # Statik dosyalar
└── package.json
```

## 🛠️ Teknoloji Stack

### **Frontend**
- **Next.js 15.5.3** - React framework with App Router
- **React 19.1.0** - UI library  
- **TypeScript** - Tip güvenliği
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Re-usable component library

### **Form & Validation**
- **React Hook Form** - Performanslı form yönetimi
- **Zod** - Schema validation
- **@hookform/resolvers** - Form resolver

### **UI & Animation**
- **Lucide React** - Modern iconlar
- **Framer Motion** - Animasyonlar (implicit)  
- **Radix UI** - Accessible component primitives
- **Sonner** - Toast notifications

### **Backend & API**
- **Next.js API Routes** - Serverless API endpoints
- **Google Sheets API** - Veri entegrasyonu
- **Telegram Bot API** - Bildirim sistemi

## 🔧 API Endpoints

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/data` | GET | Sınıf/şube listesi |
| `/api/students?sinifSube={id}` | GET | Sınıfa göre öğrenci listesi |
| `/api/teachers` | GET | Öğretmen listesi |
| `/api/teachers` | POST | Öğretmen cache güncelleme |
| `/api/send-guidance` | POST | Telegram'a bildirim gönder |

## 🎯 Kullanım

### 1. **Öğretmen Seçimi**
- Dropdown'dan öğretmen seçin
- Sınıf otomatik olarak doldurulur
- Öğrenci listesi güncellenir

### 2. **Öğrenci Ekleme**  
- Listeden öğrenci seçin
- Yönlendirme nedenlerini işaretleyin
- İsteğe bağlı not ekleyin
- "Öğrenci Ekle" butonuna tıklayın

### 3. **Toplu Gönderim**
- Eklenen öğrencileri gözden geçirin
- "Gönder" butonu ile Telegram'a bildirin
- Google Sheets'e kaydet

## 🎨 Yönlendirme Nedenleri

- Akran Zorbalığı Yapan
- Özel Gereksinimli  
- Devamsızlık Yapan
- Sınıf Kurallarına Uymayan
- Öksüz/Yetim
- Ailevi Travması Olan
- Maddi Durumu Yetersiz
- Göçmen / Mülteci (Suriyeli)
- RAM'a yönlendirilmesi gereken

## 🔐 Güvenlik

- **Çevre değişkenleri** - Hassas bilgiler .env.local'de
- **API rate limiting** - Aşırı kullanım koruması
- **Input validation** - Zod schema ile doğrulama
- **Error boundaries** - Hata yakalama ve fallback

## 📱 Mobil Uyumluluk

- **Responsive design** - Tüm ekran boyutlarında çalışır
- **Touch optimized** - Dokunmatik cihazlar için optimize
- **Sticky elements** - Mobilde kolay erişim
- **Fast loading** - Optimize edilmiş performans

## 🚀 Deployment

### Vercel (Önerilen)
```bash
npm run build
vercel --prod
```

### Docker
```bash
docker build -t rpd-app .
docker run -p 3000:3000 rpd-app
```

### Manuel Deployment
```bash
npm run build
npm start
```

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje [MIT License](LICENSE) altında lisanslanmıştır.

## 🙏 Teşekkürler

- [Next.js](https://nextjs.org/) - React framework
- [Shadcn/ui](https://ui.shadcn.com/) - Component library  
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Lucide](https://lucide.dev/) - Icon library

---

<div align="center">
  <strong>🎓 Eğitimde Dijital Dönüşüm</strong><br>
  Modern web teknolojileri ile eğitim süreçlerini kolaylaştırın
</div>
