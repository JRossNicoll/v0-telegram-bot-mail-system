import { type NextRequest, NextResponse } from "next/server"
import { setWebhook } from "@/lib/telegram/api"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (typeof url !== "string" || url.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Webhook URL required" }, { status: 400 })
    }

    await setWebhook(url)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[admin] Failed to set Telegram webhook:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
