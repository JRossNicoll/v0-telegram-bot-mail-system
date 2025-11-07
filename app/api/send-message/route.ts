import { type NextRequest, NextResponse } from "next/server"
import { saveMessage } from "@/lib/storage/messages"
import { getEncryptedPrivateKey, getTelegramIdByWallet } from "@/lib/storage/users"
import { sendOnChainMessage } from "@/lib/solana/transactions"
import { sendMessage as sendTelegramMessage } from "@/lib/telegram/api"

export async function POST(request: NextRequest) {
  try {
    const { from, to, message, onChain } = await request.json()

    console.log("[v0] Send message request:", { from, to, onChain })

    if (!from || !to || !message) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Validate addresses
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(from) || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(to)) {
      return NextResponse.json({ success: false, error: "Invalid wallet address" }, { status: 400 })
    }

    const sendOnChain = typeof onChain === "string" ? onChain === "true" : Boolean(onChain)

    let txSignature: string | undefined

    if (sendOnChain) {
      // Send on-chain message
      const senderTelegramId = await getTelegramIdByWallet(from)
      if (!senderTelegramId) {
        return NextResponse.json(
          { success: false, error: "Wallet not linked to Telegram. Use the Telegram bot to connect." },
          { status: 400 },
        )
      }

      const encryptedKey = await getEncryptedPrivateKey(senderTelegramId)

      if (!encryptedKey) {
        return NextResponse.json(
          { success: false, error: "Wallet credentials not found. Please reconnect your wallet." },
          { status: 400 },
        )
      }

      try {
        const result = await sendOnChainMessage(encryptedKey, to, message)
        txSignature = result.signature
        console.log("[v0] On-chain message sent:", txSignature)
      } catch (error: any) {
        console.error("[v0] On-chain send error:", error)
        return NextResponse.json(
          { success: false, error: error.message || "Failed to send on-chain message" },
          { status: 500 },
        )
      }
    }

    // Save message to storage
    await saveMessage({
      from,
      to,
      message,
      onChain: sendOnChain,
      txSignature,
    })

    // Notify recipient via Telegram if they have an account
    const recipientTelegramId = await getTelegramIdByWallet(to)
    if (recipientTelegramId) {
      try {
        await sendTelegramMessage(
          Number.parseInt(recipientTelegramId),
          `📬 <b>New Message</b>\n\n` +
            `From: <code>${from.slice(0, 6)}...${from.slice(-4)}</code>\n` +
            `Type: ${sendOnChain ? "On-Chain ⛓" : "Off-Chain 💬"}\n` +
            `Message: <i>${message}</i>` +
            (txSignature ? `\n\n<a href="https://solscan.io/tx/${txSignature}">View Transaction →</a>` : ""),
        )
      } catch (error) {
        console.error("[v0] Failed to notify recipient:", error)
      }
    }

    return NextResponse.json({
      success: true,
      signature: txSignature,
      explorerUrl: txSignature ? `https://solscan.io/tx/${txSignature}` : undefined,
    })
  } catch (error: any) {
    console.error("[v0] Send message error:", error)
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}
