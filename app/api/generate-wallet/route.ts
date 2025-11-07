import { type NextRequest, NextResponse } from "next/server"
import { generateWallet } from "@/lib/solana/wallet"
import { connectWallet, getUser } from "@/lib/storage/users"

export async function POST(request: NextRequest) {
  try {
    const { telegramId } = await request.json()

    console.log("[v0] ========== WALLET GENERATION ==========")
    console.log("[v0] Timestamp:", new Date().toISOString())
    console.log("[v0] Telegram ID:", telegramId)
    console.log("[v0] Telegram ID type:", typeof telegramId)
    console.log("[v0] Request Origin:", request.headers.get("origin"))

    if (!telegramId) {
      console.log("[v0] GENERATION FAILED: No telegram ID provided")
      return NextResponse.json({ error: "Telegram ID required" }, { status: 400 })
    }

    // Check if user already has a wallet
    const existingUser = await getUser(telegramId)
    if (existingUser) {
      console.log("[v0] User already has wallet:", existingUser.walletAddress)
      console.log("[v0] Returning existing wallet instead of generating new one")
      return NextResponse.json({
        success: true,
        walletAddress: existingUser.walletAddress,
        isExisting: true,
      })
    }

    console.log("[v0] Generating new Solana wallet...")
    const { publicKey, encryptedPrivateKey } = generateWallet()
    console.log("[v0] Wallet generated successfully")
    console.log("[v0] Public Key:", publicKey)
    console.log("[v0] Encrypted Private Key length:", encryptedPrivateKey.length)
    console.log("[v0] Encrypted Private Key (first 50 chars):", encryptedPrivateKey.substring(0, 50))

    console.log("[v0] Saving wallet to Redis...")
    await connectWallet(telegramId, publicKey, encryptedPrivateKey)
    console.log("[v0] Wallet saved successfully")

    // Verify the save
    const verifyUser = await getUser(telegramId)
    console.log("[v0] Verification - User retrieved:", {
      found: !!verifyUser,
      walletMatches: verifyUser?.walletAddress === publicKey,
      hasEncryptedKey: !!verifyUser?.encryptedPrivateKey,
      encryptedKeyMatches: verifyUser?.encryptedPrivateKey === encryptedPrivateKey,
    })

    console.log("[v0] GENERATION SUCCESS")
    console.log("[v0] ==========================================")

    return NextResponse.json({
      success: true,
      walletAddress: publicKey,
      isExisting: false,
    })
  } catch (error) {
    console.error("[v0] GENERATION ERROR:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json({ error: "Failed to generate wallet" }, { status: 500 })
  }
}
