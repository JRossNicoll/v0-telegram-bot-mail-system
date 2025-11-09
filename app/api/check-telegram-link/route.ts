import { type NextRequest, NextResponse } from "next/server"
import { isWalletLinked, getTelegramIdByWallet } from "@/lib/storage/users"

export async function GET(req: NextRequest) {
  try {
    const wallet = req.nextUrl.searchParams.get("wallet")

    if (!wallet) {
      return NextResponse.json({ success: false, error: "Missing wallet address" }, { status: 400 })
    }

    console.log("[v0] Checking telegram link for wallet:", wallet)

    const isLinked = await isWalletLinked(wallet)
    const telegramId = isLinked ? await getTelegramIdByWallet(wallet) : null

    console.log("[v0] Telegram link status:", { isLinked, telegramId })

    return NextResponse.json({
      success: true,
      isLinked,
      telegramId,
    })
  } catch (error: any) {
    console.error("[v0] Error checking telegram link:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { walletAddress } = await req.json()

    if (!walletAddress) {
      return NextResponse.json({ success: false, error: "Missing wallet address" }, { status: 400 })
    }

    console.log("[v0] Checking telegram link for wallet (POST):", walletAddress)

    const isLinked = await isWalletLinked(walletAddress)
    const telegramId = isLinked ? await getTelegramIdByWallet(walletAddress) : null

    console.log("[v0] Telegram link status (POST):", { isLinked, telegramId })

    return NextResponse.json({
      success: true,
      isLinked,
      telegramId,
    })
  } catch (error: any) {
    console.error("[v0] Error checking telegram link:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
