import { type NextRequest, NextResponse } from "next/server"
import { connectWallet } from "@/lib/storage/users"
import { sendMessage } from "@/lib/telegram/api"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, walletAddress } = body

    if (!userId || !walletAddress) {
      return NextResponse.json({ success: false, error: "Missing userId or walletAddress" }, { status: 400 })
    }

    // Validate Solana address format
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
      return NextResponse.json({ success: false, error: "Invalid Solana wallet address" }, { status: 400 })
    }

    // Save the wallet connection
    await connectWallet(userId, walletAddress)

    try {
      await sendMessage(
        Number.parseInt(userId),
        `✅ <b>Wallet Connected Successfully!</b>\n\n` +
          `<b>Address:</b>\n<code>${walletAddress}</code>\n\n` +
          `🎉 You're all set! You can now:\n` +
          `• Send messages to other wallets\n` +
          `• Receive messages in your inbox\n` +
          `• Send on-chain transactions`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "📤 Send Message",
                  callback_data: "choose_send_type",
                },
                {
                  text: "📬 View Inbox",
                  callback_data: "view_inbox",
                },
              ],
            ],
          },
        },
      )
    } catch (telegramError) {
      console.error("[v0] Failed to send Telegram notification:", telegramError)
      // Don't fail the request if Telegram notification fails
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Connect wallet API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
