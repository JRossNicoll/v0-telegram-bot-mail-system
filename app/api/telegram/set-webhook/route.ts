import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  console.log("[v0] Set webhook endpoint called")

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
  const BASE_URL = process.env.PUBLIC_BASE_URL
  const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || ""

  console.log("[v0] Environment check:", {
    hasToken: !!BOT_TOKEN,
    hasBaseUrl: !!BASE_URL,
    baseUrl: BASE_URL,
  })

  if (!BOT_TOKEN || !BASE_URL) {
    console.error("[v0] Missing required environment variables")
    return NextResponse.json({ ok: false, error: "Missing TELEGRAM_BOT_TOKEN or PUBLIC_BASE_URL" }, { status: 400 })
  }

  const api = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`
  const webhookUrl = `${BASE_URL}/api/webhook${SECRET ? `?secret=${SECRET}` : ""}`

  console.log("[v0] Setting webhook to:", webhookUrl)

  try {
    const res = await fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl }),
    })

    const data = await res.json()
    console.log("[v0] Telegram API response:", data)

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Webhook setup error:", error)
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Failed to set webhook",
      },
      { status: 500 },
    )
  }
}
