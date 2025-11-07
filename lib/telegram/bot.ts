const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

if (!BOT_TOKEN) {
  console.warn("[telegram] TELEGRAM_BOT_TOKEN is not configured. Telegram bot helper will be disabled.")
}

export const BOT_API_URL = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : null

export async function sendTelegramMessage(chatId: number, text: string) {
  if (!BOT_API_URL) {
    throw new Error("Telegram bot token is not configured")
  }

  const response = await fetch(`${BOT_API_URL}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  })
  return response.json()
}

export async function getBotInfo() {
  if (!BOT_API_URL) {
    throw new Error("Telegram bot token is not configured")
  }

  const response = await fetch(`${BOT_API_URL}/getMe`)
  return response.json()
}
