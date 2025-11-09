import { type NextRequest, NextResponse } from "next/server"
import { isWalletLinked, getTelegramIdByWallet } from "@/lib/storage/users"

export async function GET(req: NextRequest) {
  try {
    const wallet = req.nextUrl.searchParams.get("wallet")

    if (!wallet) {
      return NextResponse.json({ success: false, error: "Missing wallet address" }, { status: 400 })
    }

    const isLinked = await isWalletLinked(wallet)
    const telegramId = isLinked ? await getTelegramIdByWallet(wallet) : null

    return NextResponse.json({
      success: true,
      linked: isLinked,
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

    const isLinked = await isWalletLinked(walletAddress)
    const telegramId = isLinked ? await getTelegramIdByWallet(walletAddress) : null

    return NextResponse.json({
      success: true,
      linked: isLinked,
      telegramId,
    })
  } catch (error: any) {
    console.error("[v0] Error checking telegram link:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
