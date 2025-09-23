import { YonlendirilenOgrenci } from '@/types';

// Telegram Bot API integration
export async function sendTelegramMessage(messages: string[]): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('Telegram configuration missing. Please check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env.local');
    return false;
  }

  try {
    for (const message of messages) {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`);
      }

      // Rate limiting: wait between messages
      if (messages.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`✅ ${messages.length} mesaj Telegram'a başarıyla gönderildi`);
    return true;
  } catch (error) {
    console.error('Telegram gönderim hatası:', error);
    return false;
  }
}

// Enhanced Telegram message formatting with HTML
function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function formatTelegramMessageHTML(
  ogretmenAdi: string,
  ogrenciAdi: string,
  sinifSube: string,
  yonlendirmeNedeni: string,
  not?: string
): string {
  const now = new Date();
  const tarih = now.toLocaleDateString('tr-TR');
  const saat = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  
  const lines = [
    `📋 <b>RPD Öğrenci Yönlendirme</b>`,
    '',
    `📅 <b>TarihSaat:</b> ${escapeHtml(`${tarih} ${saat}`)}`,
    `👨‍🏫 <b>Öğretmen:</b> ${escapeHtml(ogretmenAdi)}`,
    `🎓 <b>Sınıf:</b> ${escapeHtml(sinifSube)}`,
    `👤 <b>Öğrenci:</b> ${escapeHtml(ogrenciAdi)}`,
    `⚠️ <b>Neden:</b> ${escapeHtml(yonlendirmeNedeni)}`,
  ];

  if (not && not.trim().length > 0) {
    lines.push(`📝 <b>Not:</b> ${escapeHtml(not)}`);
  }

  return lines.join('\n');
}