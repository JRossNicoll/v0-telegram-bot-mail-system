import { type NextRequest, NextResponse } from "next/server"
import { getUnreadCount } from "@/lib/storage/messages"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet = searchParams.get("wallet")

    if (!wallet) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
    }

    const unreadCount = await getUnreadCount(wallet)

    return NextResponse.json({ unreadCount })
  } catch (error) {
    console.error("[v0] Error fetching unread count:", error)
    return NextResponse.json({ error: "Failed to fetch unread count" }, { status: 500 })
  }
}
