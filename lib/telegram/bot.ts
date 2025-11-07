const BOT_TOKEN = "8200042995:AAGrZRpMwlUKrHC_aYEgDjluYFdMFWkquWo"

export const BOT_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`

export async function sendTelegramMessage(chatId: number, text: string) {
  const response = await fetch(`${BOT_API_URL}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  })
  return response.json()
}

export async function getBotInfo() {
  const response = await fetch(`${BOT_API_URL}/getMe`)
  return response.json()
}
