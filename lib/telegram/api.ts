const BOT_TOKEN = "8200042995:AAGrZRpMwlUKrHC_aYEgDjluYFdMFWkquWo"
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`

export async function sendMessage(
  chatId: number,
  text: string,
  options?: {
    parse_mode?: string
    reply_markup?: any
  },
) {
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: options?.parse_mode || "HTML",
        ...(options?.reply_markup && { reply_markup: options.reply_markup }),
      }),
    })

    const data = await response.json()

    if (!data.ok) {
      console.error("[v0] Telegram API error:", data)
      throw new Error(`Telegram API error: ${data.description}`)
    }

    return data.result
  } catch (error) {
    console.error("[v0] Error sending message:", error)
    throw error
  }
}

export async function setWebhook(webhookUrl: string) {
  try {
    const response = await fetch(`${TELEGRAM_API}/setWebhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: webhookUrl,
      }),
    })

    const data = await response.json()

    if (!data.ok) {
      console.error("[v0] Set webhook error:", data)
      throw new Error(`Failed to set webhook: ${data.description}`)
    }

    return data.result
  } catch (error) {
    console.error("[v0] Error setting webhook:", error)
    throw error
  }
}

export async function getWebhookInfo() {
  try {
    const response = await fetch(`${TELEGRAM_API}/getWebhookInfo`)
    const data = await response.json()

    if (!data.ok) {
      throw new Error(`Failed to get webhook info: ${data.description}`)
    }

    return data.result
  } catch (error) {
    console.error("[v0] Error getting webhook info:", error)
    throw error
  }
}

export async function deleteWebhook() {
  try {
    const response = await fetch(`${TELEGRAM_API}/deleteWebhook`, {
      method: "POST",
    })
    const data = await response.json()

    if (!data.ok) {
      throw new Error(`Failed to delete webhook: ${data.description}`)
    }

    return data.result
  } catch (error) {
    console.error("[v0] Error deleting webhook:", error)
    throw error
  }
}
