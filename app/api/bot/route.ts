import { NextResponse } from "next/server"
import { getBotInfo } from "@/lib/telegram/bot"

export async function GET() {
  try {
    const botInfo = await getBotInfo()

    if (botInfo.ok) {
      return NextResponse.json({
        status: `Bot @${botInfo.result.username} is ready!`,
        commands: [
          "/start - Start the bot",
          "/connect <wallet> - Connect wallet",
          "/send <wallet> <message> - Send message",
          "/sendchain <wallet> <message> - Send on-chain",
          "/inbox - View messages",
          "/wallet - View connected wallet",
        ],
      })
    } else {
      return NextResponse.json({ status: "Bot token invalid" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Bot initialization error:", error)
    return NextResponse.json({ status: "Error initializing bot" }, { status: 500 })
  }
}
