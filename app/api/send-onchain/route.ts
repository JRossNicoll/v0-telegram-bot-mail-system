import { type NextRequest, NextResponse } from "next/server"
import { Connection, Transaction } from "@solana/web3.js"
import { saveMessage } from "@/lib/storage/messages"

const RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/CB96lmCb3cPLg_voLlDsm"

export async function POST(request: NextRequest) {
  try {
    const { fromWallet, toWallet, message, signedTransaction } = await request.json()

    if (!fromWallet || !toWallet || !message || !signedTransaction) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const connection = new Connection(RPC_URL, "confirmed")

    // Deserialize and send the signed transaction
    const transaction = Transaction.from(Buffer.from(signedTransaction, "base64"))
    const signature = await connection.sendRawTransaction(transaction.serialize())

    // Wait for confirmation
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed")
    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    })

    // Save message to storage
    saveMessage(fromWallet, toWallet, message, signature)

    return NextResponse.json({
      success: true,
      signature,
      explorerUrl: `https://solscan.io/tx/${signature}`,
    })
  } catch (error: any) {
    console.error("[v0] Error sending on-chain message:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to send message" }, { status: 500 })
  }
}
