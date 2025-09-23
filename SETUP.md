# RPD Öğrenci Yönlendirme Sistemi

Bu sistem öğretmenlerin rehberlik servisine öğrenci yönlendirmesi yapmasını sağlar. Yönlendirmeler otomatik olarak Telegram ve Google Sheets'e kaydedilir.

## 🚀 Özellikler

- 📋 Öğrenci yönlendirme formu
- 📊 Google Sheets entegrasyonu (kayıt tutma)
- 📱 Telegram bildirimleri
- 🎯 Sınıf/şube bazlı öğrenci filtreleme
- 📱 Responsive tasarım

## ⚙️ Kurulum

1. **Proje bağımlılıklarını yükleyin:**
```bash
npm install
```

2. **Environment variables (.env.local) dosyasını yapılandırın:**

### Telegram Bot Kurulumu
1. [@BotFather](https://t.me/botfather) ile yeni bot oluşturun
2. Bot token'ını alın
3. Botunuzu grubunuza ekleyin
4. Chat ID'sini öğrenmek için: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`

### Google Sheets Kurulumu
1. [Google Cloud Console](https://console.cloud.google.com/) üzerinden yeni proje oluşturun
2. Google Sheets API'sini etkinleştirin
3. Service Account oluşturun ve JSON key dosyasını indirin
4. Google Sheets dosyası oluşturun ve Service Account email'ini editör olarak ekleyin

### .env.local dosyanızı düzenleyin:
```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here

# Google Sheets Configuration
GOOGLE_SHEETS_ID=your_google_sheets_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email_here
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

3. **Geliştirme sunucusunu başlatın:**
```bash
npm run dev
```

## 📱 Kullanım

1. Öğretmen adınızı girin
2. Sınıf/şube seçin
3. Öğrenci seçin
4. Yönlendirme nedenini belirtin
5. "Öğrenci Ekle" butonuna tıklayın
6. Tüm öğrencileri ekledikten sonra "Rehberlik Servisine Gönder" butonuna tıklayın

## 🔧 Teknik Detaylar

- **Framework:** Next.js 15 with App Router
- **Styling:** Tailwind CSS + shadcn/ui
- **Form Management:** React Hook Form + Zod
- **Notifications:** Sonner
- **Integrations:** Google Sheets API, Telegram Bot API

## 📋 Yönlendirme Nedenleri

- Akran Zorbalığı Yapan
- Özel Gereksinimli
- Devamsızlık Yapan
- Sınıf Kurallarına Uymayan
- Öksüz/Yetim
- Ailevi Travması Olan
- Maddi Durumu Yetersiz
- Göçmen / Mülteci (Suriyeli)
- RAM'a yönlendirilmesi gereken

## 🛠️ Sorun Giderme

### Öğrenci listesi dökülmüyor:
- `data.json` dosyasında sınıf formatını kontrol edin
- URL encoding sorunları için debug loglarını inceleyin

### Telegram gönderimi çalışmıyor:
- Bot token'ın doğru olduğunu kontrol edin
- Chat ID'nin doğru olduğunu kontrol edin
- Botun gruba eklendiğini kontrol edin

### Google Sheets çalışmıyor:
- Service Account'un Sheets'e erişim yetkisi olduğunu kontrol edin
- Private key formatının doğru olduğunu kontrol edin
- Sheets ID'nin doğru olduğunu kontrol edin