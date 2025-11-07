import { type NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/storage/users"
import { decryptPrivateKey } from "@/lib/solana/wallet"
import bs58 from "bs58"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Export key GET request received")
    const { searchParams } = new URL(request.url)
    const telegramId = searchParams.get("userId")
    console.log("[v0] Telegram ID from query:", telegramId)

    if (!telegramId) {
      console.log("[v0] ERROR: No telegram ID provided")
      return NextResponse.json({ error: "Telegram ID is required" }, { status: 400 })
    }

    console.log("[v0] Fetching user from Redis...")
    const user = await getUser(telegramId)
    console.log("[v0] User data retrieved:", user ? "User found" : "User not found")
    console.log("[v0] User wallet address:", user?.walletAddress)
    console.log("[v0] Has encrypted private key:", !!user?.encryptedPrivateKey)
    console.log("[v0] Encrypted private key value:", user?.encryptedPrivateKey?.substring(0, 50) + "...")

    if (!user) {
      console.log("[v0] ERROR: User not found in Redis")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.encryptedPrivateKey) {
      console.log("[v0] ERROR: No encrypted private key found for user")
      return NextResponse.json(
        { error: "No private key found for this wallet. Please regenerate your wallet." },
        { status: 404 },
      )
    }

    console.log("[v0] Decrypting private key...")
    let privateKeyBytes: Uint8Array
    try {
      privateKeyBytes = decryptPrivateKey(user.encryptedPrivateKey)
      console.log("[v0] Private key decrypted successfully, length:", privateKeyBytes.length)
    } catch (decryptError: any) {
      console.error("[v0] Decryption error:", decryptError)
      return NextResponse.json({ error: "Failed to decrypt private key: " + decryptError.message }, { status: 500 })
    }

    let privateKeyBase58: string
    try {
      privateKeyBase58 = bs58.encode(privateKeyBytes)
      console.log("[v0] Private key converted to base58 format, length:", privateKeyBase58.length)
    } catch (encodeError: any) {
      console.error("[v0] Base58 encoding error:", encodeError)
      return NextResponse.json({ error: "Failed to encode private key: " + encodeError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      privateKey: privateKeyBase58,
      walletAddress: user.walletAddress,
    })
  } catch (error: any) {
    console.error("[v0] Error exporting private key:", error)
    console.error("[v0] Error stack:", error.stack)
    return NextResponse.json({ error: error.message || "Failed to export private key" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { telegramId } = await request.json()

    if (!telegramId) {
      return NextResponse.json({ error: "Telegram ID is required" }, { status: 400 })
    }

    const user = await getUser(telegramId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Decrypt the private key
    const privateKeyBytes = decryptPrivateKey(user.encryptedPrivateKey)

    // Convert to base58 format (standard Solana private key format)
    const privateKeyBase58 = bs58.encode(privateKeyBytes)

    return NextResponse.json({
      success: true,
      privateKey: privateKeyBase58,
      walletAddress: user.walletAddress,
    })
  } catch (error: any) {
    console.error("[v0] Error exporting private key:", error)
    console.error("[v0] Error stack:", error.stack)
    return NextResponse.json({ error: error.message || "Failed to export private key" }, { status: 500 })
  }
}
