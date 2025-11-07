import { type NextRequest, NextResponse } from "next/server"
import { getWalletBalance } from "@/lib/solana/transactions"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet = searchParams.get("wallet")

    if (!wallet) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
    }

    const balance = await getWalletBalance(wallet)

    return NextResponse.json({ balance })
  } catch (error) {
    console.error("[v0] Error fetching balance:", error)
    return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 })
  }
}
