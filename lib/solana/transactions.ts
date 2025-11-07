import { Connection, PublicKey, TransactionInstruction, Transaction, SystemProgram } from "@solana/web3.js"
import { Buffer } from "node:buffer"
import { getKeypairFromEncrypted } from "./wallet"

const RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/CB96lmCb3cPLg_voLlDsm"

export async function sendOnChainMessage(
  encryptedPrivateKey: string,
  toWallet: string,
  message: string,
): Promise<{ signature: string; explorerUrl: string }> {
  const connection = new Connection(RPC_URL, "confirmed")

  try {
    const senderKeypair = getKeypairFromEncrypted(encryptedPrivateKey)
    const toPubkey = new PublicKey(toWallet)

    const memoInstruction = new TransactionInstruction({
      keys: [],
      programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
      data: Buffer.from(`📧 ${message}`),
    })

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed")

    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: senderKeypair.publicKey,
    })

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey,
        lamports: 1000, // 0.000001 SOL
      }),
    )

    transaction.add(memoInstruction)

    transaction.sign(senderKeypair)

    const signature = await connection.sendRawTransaction(transaction.serialize())

    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    })

    const explorerUrl = `https://solscan.io/tx/${signature}`

    console.log("[v0] On-chain message sent:", {
      from: senderKeypair.publicKey.toBase58(),
      to: toWallet,
      signature,
    })

    return { signature, explorerUrl }
  } catch (error) {
    console.error("[v0] Error sending on-chain message:", error)
    throw error
  }
}

export async function getTransactionDetails(signature: string): Promise<any> {
  const connection = new Connection(RPC_URL, "confirmed")

  try {
    const transaction = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    })
    return transaction
  } catch (error) {
    console.error("[v0] Error fetching transaction:", error)
    return null
  }
}

export async function createAndSendMessage(
  fromWallet: string,
  toWallet: string,
  message: string,
  signTransaction: (transaction: any) => Promise<any>,
): Promise<string> {
  const connection = new Connection(RPC_URL, "confirmed")

  try {
    const fromPubkey = new PublicKey(fromWallet)
    const toPubkey = new PublicKey(toWallet)

    const memoInstruction = new TransactionInstruction({
      keys: [],
      programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
      data: Buffer.from(`📧 ${message}`),
    })

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed")

    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: fromPubkey,
    })

    // Add a small transfer (0.000001 SOL) to notify the recipient
    transaction.add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: 1000, // 0.000001 SOL
      }),
    )

    transaction.add(memoInstruction)

    // Sign and send transaction
    const signedTransaction = await signTransaction(transaction)
    const signature = await connection.sendRawTransaction(signedTransaction.serialize())

    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    })

    console.log("[v0] On-chain message sent:", {
      from: fromWallet,
      to: toWallet,
      signature,
    })

    return signature
  } catch (error) {
    console.error("[v0] Error sending on-chain message:", error)
    throw error
  }
}

export async function getWalletBalance(walletAddress: string): Promise<number> {
  const connection = new Connection(RPC_URL, "confirmed")

  try {
    const publicKey = new PublicKey(walletAddress)
    const balance = await connection.getBalance(publicKey)
    return balance / 1e9 // Convert lamports to SOL
  } catch (error) {
    console.error("[v0] Error getting balance:", error)
    return 0
  }
}
