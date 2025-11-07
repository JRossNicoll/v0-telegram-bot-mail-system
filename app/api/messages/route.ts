import { type NextRequest, NextResponse } from "next/server"
import { getMessagesForWallet } from "@/lib/storage/messages"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet = searchParams.get("wallet")

    if (!wallet) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
    }

    // Validate Solana address format
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet)) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 })
    }

    const messages = await getMessagesForWallet(wallet)
    const normalized = messages.map((message) => ({
      ...message,
      read: message.isRead,
    }))

    return NextResponse.json({
      wallet,
      messages: normalized,
      count: normalized.length,
    })
  } catch (error) {
    console.error("[v0] Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}
