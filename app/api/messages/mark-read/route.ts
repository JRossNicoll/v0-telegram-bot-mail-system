import { type NextRequest, NextResponse } from "next/server"
import { markMessageAsRead } from "@/lib/storage/messages"

export async function POST(request: NextRequest) {
  try {
    const { wallet, messageId } = await request.json()

    if (!wallet || !messageId) {
      return NextResponse.json({ error: "Wallet and messageId required" }, { status: 400 })
    }

    await markMessageAsRead(wallet, messageId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error marking message as read:", error)
    return NextResponse.json({ error: "Failed to mark message as read" }, { status: 500 })
  }
}
