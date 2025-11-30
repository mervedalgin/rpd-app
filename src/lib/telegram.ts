// Telegram Bot API integration
export type TelegramSendFailure = {
  index: number;
  status?: number | null;
  body?: string;
  error?: string;
};

export type TelegramSendResult = {
  total: number;
  sent: number;
  failures: TelegramSendFailure[];
};

export async function sendTelegramMessage(messages: string[]): Promise<TelegramSendResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('Telegram configuration missing. Please check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in environment');
    return { total: messages.length, sent: 0, failures: [{ index: -1, error: 'missing-configuration' }] };
  }

  const failures: TelegramSendFailure[] = [];
  let sent = 0;

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    try {
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
        const text = await response.text().catch(() => 'unable-to-read-body');
        console.error(`Telegram API returned ${response.status}: ${text}`);
        failures.push({ index: i, status: response.status, body: text });
      } else {
        sent += 1;
      }
    } catch (err: any) {
      console.error('Telegram send error:', err?.message || err);
      failures.push({ index: i, error: String(err?.message ?? err) });
    }

    // Simple rate limiting between messages
    if (messages.length > 1) {
      // 1s delay to avoid hitting Telegram limits when sending multiple messages
      // (can be tuned or replaced with a more robust backoff)
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  if (failures.length === 0) {
    console.log(`✅ ${sent}/${messages.length} mesaj Telegram'a başarıyla gönderildi`);
  } else {
    console.warn(`⚠️ Telegram gönderiminde ${failures.length} hata oluştu (${sent}/${messages.length} gönderildi)`);
  }

  return { total: messages.length, sent, failures };
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