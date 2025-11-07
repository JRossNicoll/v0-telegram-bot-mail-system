const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendTelegramMessage(chatId: number, text: string) {
  if (!BOT_TOKEN) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN not configured");
    return;
  }
  const res = await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("[telegram] sendMessage failed", t);
  }
}

export function requireTelegramSecret(searchParams: URLSearchParams) {
  const secret = searchParams.get("secret");
  if (!process.env.TELEGRAM_WEBHOOK_SECRET) return true; // allow if not set
  return secret === process.env.TELEGRAM_WEBHOOK_SECRET;
}
