import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import bs58 from "bs58"
import { getEncryptedPrivateKey, getTelegramIdByWallet } from "@/lib/storage/users"
import { decryptPrivateKey } from "@/lib/solana/wallet"

function isValidSolanaAddress(value: unknown): value is string {
  return typeof value === "string" && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const walletAddress = cookieStore.get("courier_wallet")?.value

    if (!isValidSolanaAddress(walletAddress)) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const telegramId = await getTelegramIdByWallet(walletAddress)
    if (!telegramId) {
      return NextResponse.json({ error: "Wallet not linked to Telegram" }, { status: 403 })
    }

    const encryptedKey = await getEncryptedPrivateKey(telegramId)
    if (!encryptedKey) {
      return NextResponse.json({ error: "No custodial key found" }, { status: 400 })
    }

    const privateKeyBytes = decryptPrivateKey(encryptedKey)
    const privateKeyBase58 = bs58.encode(privateKeyBytes)

    return NextResponse.json({ privateKey: privateKeyBase58 })
  } catch (error) {
    console.error("Error exporting key:", error)
    return NextResponse.json({ error: "Failed to export key" }, { status: 500 })
  }
}
