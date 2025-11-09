import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { saveMessage } from "@/lib/storage/messages"
import { getEncryptedPrivateKey, getTelegramIdByWallet } from "@/lib/storage/users"
import { sendOnChainMessage } from "@/lib/solana/transactions"

function isValidSolanaAddress(address: unknown): address is string {
  return typeof address === "string" && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const walletAddress = cookieStore.get("courier_wallet")?.value

    if (!isValidSolanaAddress(walletAddress)) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { toWallet, message } = await req.json()

    if (!isValidSolanaAddress(toWallet) || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const telegramId = await getTelegramIdByWallet(walletAddress)
    if (!telegramId) {
      return NextResponse.json({ error: "Wallet not linked to Telegram" }, { status: 403 })
    }

    const encryptedKey = await getEncryptedPrivateKey(telegramId)
    if (!encryptedKey) {
      return NextResponse.json({ error: "No custodial key available" }, { status: 400 })
    }

    const result = await sendOnChainMessage(encryptedKey, toWallet, message)

    await saveMessage(
      walletAddress,
      toWallet,
      message,
      result.signature,
      true, // isOnchain = true
    )

    return NextResponse.json({
      success: true,
      signature: result.signature,
      explorerUrl: result.explorerUrl,
    })
  } catch (error) {
    console.error("send-onchain error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
