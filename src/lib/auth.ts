// Edge-uyumlu panel oturum doğrulaması.
//
// panel-auth/route.ts oturumu Node `crypto` (createHmac) ile İMZALAR.
// Bu modül aynı imzayı Web Crypto (crypto.subtle) ile DOĞRULAR; böylece
// Next.js middleware (Edge runtime) içinde de çalışır. İki taraf da
// HMAC-SHA256 ürettiği için imzalar birebir aynıdır.
//
// Cookie formatı: `${payload}.${expiry}.${signatureHex}`
//   signature = HMAC_SHA256(`${payload}.${expiry}`, SESSION_SECRET)

const SESSION_SECRET =
  process.env.CRON_SECRET || process.env.API_SECRET_KEY || "rpd-fallback-secret";

function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

// Sabit-zamanlı string karşılaştırması (timing attack'a karşı).
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function verifyPanelSession(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;

  const parts = cookieValue.split(".");
  if (parts.length !== 3) return false;

  const [payload, expiry, signature] = parts;

  const expiryTime = parseInt(expiry, 10);
  if (Number.isNaN(expiryTime) || Date.now() > expiryTime) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(`${payload}.${expiry}`));
  const expected = toHex(signed);

  return safeEqual(signature, expected);
}
