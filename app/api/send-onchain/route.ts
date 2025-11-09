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

    console.log("[v0] send-onchain: wallet address:", walletAddress)

    if (!isValidSolanaAddress(walletAddress)) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { toWallet, message } = await req.json()

    console.log("[v0] send-onchain: toWallet:", toWallet, "message:", message)

    if (!isValidSolanaAddress(toWallet) || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const telegramId = await getTelegramIdByWallet(walletAddress)
    console.log("[v0] send-onchain: telegramId:", telegramId)

    if (!telegramId) {
      return NextResponse.json({ error: "Wallet not linked to Telegram" }, { status: 403 })
    }

    const encryptedKey = await getEncryptedPrivateKey(telegramId)
    console.log("[v0] send-onchain: has encrypted key:", !!encryptedKey)

    if (!encryptedKey) {
      return NextResponse.json({ error: "No custodial key available" }, { status: 400 })
    }

    const result = await sendOnChainMessage(encryptedKey, toWallet, message)
    console.log("[v0] send-onchain: transaction result:", result.signature)

    try {
      await saveMessage(
        walletAddress,
        toWallet,
        message,
        result.signature,
        true, // isOnchain = true
      )
      console.log("[v0] send-onchain: message saved successfully")
    } catch (saveError) {
      console.error("[v0] send-onchain: failed to save message:", saveError)
      // Continue anyway - the transaction succeeded on-chain
    }

    return NextResponse.json({
      success: true,
      signature: result.signature,
      explorerUrl: result.explorerUrl,
    })
  } catch (error) {
    console.error("[v0] send-onchain error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
