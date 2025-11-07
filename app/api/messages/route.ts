import { type NextRequest, NextResponse } from "next/server"
import { getMessagesForUser } from "@/lib/storage/messages"

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

    const messages = await getMessagesForUser(wallet)

    return NextResponse.json({
      wallet,
      messages,
      count: messages.length,
    })
  } catch (error) {
    console.error("[v0] Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}
