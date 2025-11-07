import { type NextRequest, NextResponse } from "next/server"
import { getUser, getTelegramIdByWallet } from "@/lib/storage/users"

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json()

    console.log("[v0] ========== LOGIN ATTEMPT ==========")
    console.log("[v0] Timestamp:", new Date().toISOString())
    console.log("[v0] Wallet Address:", walletAddress)
    console.log("[v0] Request Origin:", request.headers.get("origin"))

    if (!walletAddress) {
      console.log("[v0] LOGIN FAILED: No wallet address provided")
      return NextResponse.json({ success: false, error: "Wallet address required" }, { status: 400 })
    }

    // Validate Solana address
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
      console.log("[v0] LOGIN FAILED: Invalid wallet address format")
      return NextResponse.json({ success: false, error: "Invalid wallet address" }, { status: 400 })
    }

    // Check if user exists by wallet address
    const telegramId = await getTelegramIdByWallet(walletAddress)
    console.log("[v0] Telegram ID lookup result:", telegramId || "NOT FOUND")

    if (!telegramId) {
      console.log("[v0] LOGIN FAILED: Wallet not registered in system")
      return NextResponse.json(
        { success: false, error: "Wallet not registered. Please generate a wallet first." },
        { status: 404 },
      )
    }

    // Get full user data
    const user = await getUser(telegramId)
    console.log("[v0] User data retrieved:", {
      telegramId,
      walletAddress: user?.walletAddress,
      hasEncryptedKey: !!user?.encryptedPrivateKey,
      connectedAt: user?.connectedAt ? new Date(user.connectedAt).toISOString() : "N/A",
    })

    if (!user) {
      console.log("[v0] LOGIN FAILED: User data not found despite Telegram ID match")
      return NextResponse.json(
        { success: false, error: "User data corrupted. Please regenerate wallet." },
        { status: 404 },
      )
    }

    console.log("[v0] LOGIN SUCCESS")
    console.log("[v0] ====================================")

    return NextResponse.json({
      success: true,
      walletAddress: user.walletAddress,
      telegramId,
    })
  } catch (error) {
    console.error("[v0] LOGIN ERROR:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
