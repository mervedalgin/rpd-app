import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

type DocumentType = "veli-mektubu" | "veli-cagrisi" | "ogretmen-mektubu" | "ogretmen-tavsiyesi" | "idare-mektubu" | "disiplin-kurulu";

interface DocumentRequest {
  documentType: DocumentType;
  currentContent: string;
  studentName: string;
  studentClass: string;
  meetingDate?: string;
  meetingTime?: string;
}

const DOCUMENT_PROMPTS: Record<DocumentType, string> = {
  "veli-mektubu": `Sen deneyimli bir okul psikolojik danışmanısın. Verilen veli mektubu taslağını profesyonel ve etkili bir şekilde geliştir.

Mektup şu özelliklere sahip olmalı:
1. Samimi ama profesyonel bir dil
2. Ebeveynin çocuğu konusunda endişelerini anlayışla karşılayan empati cümleleri
3. Çocuğun güçlü yönlerini vurgulama
4. Ev ortamında uygulanabilir pratik öneriler
5. İşbirliği ve iletişim vurgusu
6. Umut ve destek mesajı içeren kapanış

HTML formatında, <p> tag'leri ile paragraflar halinde yaz. Başlık için <h2> kullan. Önemli noktalar için <strong> kullan.`,

  "veli-cagrisi": `Sen deneyimli bir okul psikolojik danışmanısın. Verilen veli davetiye taslağını profesyonel ve etkili bir şekilde geliştir.

Davetiye şu özelliklere sahip olmalı:
1. Resmi ama sıcak bir ton
2. Görüşme amacını net ve olumlu bir şekilde açıklama
3. Tarih, saat ve yer bilgilerini vurgulama
4. Velinin hazırlıklı gelmesi için ipuçları
5. İletişim bilgileri
6. Teşekkür ve beklenti ifadesi

HTML formatında, <p> tag'leri ile paragraflar halinde yaz. Tarih/saat için <strong> kullan.`,

  "ogretmen-mektubu": `Sen deneyimli bir okul psikolojik danışmanısın. Verilen öğretmen bilgilendirme mektubu taslağını profesyonel ve faydalı bir şekilde geliştir.

Mektup şu özelliklere sahip olmalı:
1. Meslektaşlar arası profesyonel ve saygılı ton
2. Öğrenci hakkında gözlenen durumun özeti
3. Sınıf ortamında dikkat edilecek noktalar
4. Öğretmenin uygulayabileceği pratik stratejiler
5. İşbirliği çağrısı ve iletişim vurgusu
6. Gizlilik ve etik hatırlatması

HTML formatında, <p> tag'leri ile paragraflar halinde yaz. Öneriler için <ul><li> listesi kullan.`,

  "ogretmen-tavsiyesi": `Sen deneyimli bir okul psikolojik danışmanısın. Verilen öğretmen tavsiye notu taslağını daha kapsamlı ve uygulanabilir hale getir.

Tavsiye notu şu özelliklere sahip olmalı:
1. Öğrencinin ihtiyaçlarına yönelik spesifik öneriler
2. Sınıf içi müdahale stratejileri (oturma düzeni, dikkat teknikleri, vb.)
3. Akademik destek yöntemleri
4. Sosyal-duygusal destek önerileri
5. Davranış yönetimi teknikleri
6. İzleme ve geri bildirim süreci

HTML formatında, <p> tag'leri ile paragraflar halinde yaz. Her strateji kategorisi için <h3> alt başlık ve <ul><li> listesi kullan.`,

  "idare-mektubu": `Sen deneyimli bir okul psikolojik danışmanısın. Verilen idare bilgilendirme mektubu taslağını resmi ve profesyonel bir şekilde geliştir.

Mektup şu özelliklere sahip olmalı:
1. Resmi yazışma formatı ve dili
2. Durumun objektif ve net özeti
3. Yapılan müdahaleler ve sonuçları
4. Risk değerlendirmesi (varsa)
5. İdari destek veya işlem gerektiren durumlar
6. Takip planı ve öneriler

HTML formatında, <p> tag'leri ile paragraflar halinde yaz. Resmi üslup kullan.`,

  "disiplin-kurulu": `Sen deneyimli bir okul psikolojik danışmanısın. Verilen disiplin kurulu raporu taslağını resmi ve kapsamlı bir şekilde geliştir.

Rapor şu özelliklere sahip olmalı:
1. Resmi kurumsal format
2. Olayın objektif ve kronolojik anlatımı
3. Öğrencinin psikolojik durumu değerlendirmesi
4. Daha önce yapılan müdahaleler ve sonuçları
5. Risk faktörleri ve koruyucu faktörler
6. Disiplin süreci için psikolojik danışman görüşü
7. Rehabilitasyon ve destek önerileri

HTML formatında, <p> tag'leri ile paragraflar halinde yaz. Her bölüm için <h3> başlık kullan. Yasal terminolojiye dikkat et.`
};

function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API anahtarı yapılandırılmamış" },
        { status: 500 }
      );
    }

    const body: DocumentRequest = await request.json();
    const { documentType, currentContent, studentName, studentClass, meetingDate, meetingTime } = body;

    if (!documentType || !currentContent) {
      return NextResponse.json(
        { error: "Belge türü ve mevcut içerik gereklidir" },
        { status: 400 }
      );
    }

    const systemPrompt = DOCUMENT_PROMPTS[documentType];
    if (!systemPrompt) {
      return NextResponse.json(
        { error: "Geçersiz belge türü" },
        { status: 400 }
      );
    }

    const plainContent = htmlToPlainText(currentContent);

    const userPrompt = `
Öğrenci Bilgileri:
- Ad Soyad: ${studentName || "Belirtilmemiş"}
- Sınıf: ${studentClass || "Belirtilmemiş"}
${meetingDate ? `- Görüşme Tarihi: ${meetingDate}` : ""}
${meetingTime ? `- Görüşme Saati: ${meetingTime}` : ""}

Mevcut Belge İçeriği:
${plainContent}

Lütfen yukarıdaki belgeyi geliştir. İçeriği zenginleştir, daha profesyonel ve etkili hale getir. Mevcut bilgileri koru ama daha iyi ifade et. Sadece HTML içerik döndür, ekstra açıklama yapma.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt + "\n\n" + userPrompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error:", errorData);
      return NextResponse.json(
        { error: "Gemini API hatası: " + (errorData.error?.message || "Bilinmeyen hata") },
        { status: response.status }
      );
    }

    const data = await response.json();
    let generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return NextResponse.json(
        { error: "Belge oluşturulamadı" },
        { status: 500 }
      );
    }

    // Markdown formatını HTML'e dönüştür
    generatedText = generatedText
      // Code block'ları temizle
      .replace(/```html\n?/g, '')
      .replace(/```\n?/g, '')
      // Bold markdown -> HTML
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic markdown -> HTML
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Satır sonlarını <p> ile sarmalama (eğer zaten HTML değilse)
      .trim();

    // Eğer içerik HTML tag'leri içermiyorsa, paragraf olarak sarmalama
    if (!generatedText.includes('<p>') && !generatedText.includes('<h')) {
      generatedText = generatedText
        .split('\n\n')
        .map((p: string) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
        .join('');
    }

    return NextResponse.json({ document: generatedText });
  } catch (error) {
    console.error("Generate document error:", error);
    return NextResponse.json(
      { error: "Belge oluşturulurken bir hata oluştu" },
      { status: 500 }
    );
  }
}
