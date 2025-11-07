import { Keypair } from "@solana/web3.js"
import * as crypto from "crypto"

const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || "default-key-change-in-production-32bytes!!"

export function encryptPrivateKey(privateKey: Uint8Array): string {
  console.log("[v0] Encrypting private key, length:", privateKey.length)

  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv)

  let encrypted = cipher.update(Buffer.from(privateKey))
  encrypted = Buffer.concat([encrypted, cipher.final()])

  const result = iv.toString("hex") + ":" + encrypted.toString("hex")
  console.log("[v0] Encrypted private key created, length:", result.length)

  return result
}

export function decryptPrivateKey(encryptedKey: string): Uint8Array {
  console.log("[v0] Decrypting private key, input length:", encryptedKey.length)

  if (!encryptedKey || !encryptedKey.includes(":")) {
    throw new Error("Invalid encrypted key format")
  }

  const parts = encryptedKey.split(":")
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted key format: expected 2 parts")
  }

  const iv = Buffer.from(parts[0], "hex")
  const encryptedData = Buffer.from(parts[1], "hex")

  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv)

  let decrypted = decipher.update(encryptedData)
  decrypted = Buffer.concat([decrypted, decipher.final()])

  console.log("[v0] Decrypted private key, length:", decrypted.length)

  return new Uint8Array(decrypted)
}

export function generateWallet(): { publicKey: string; encryptedPrivateKey: string } {
  console.log("[v0] Generating new Solana keypair...")
  const keypair = Keypair.generate()
  const publicKey = keypair.publicKey.toBase58()

  console.log("[v0] Keypair generated, public key:", publicKey)
  console.log("[v0] Secret key length:", keypair.secretKey.length)

  const encryptedPrivateKey = encryptPrivateKey(keypair.secretKey)

  console.log("[v0] Generated new wallet:", publicKey)
  console.log("[v0] Encrypted private key created")

  return { publicKey, encryptedPrivateKey }
}

export function getKeypairFromEncrypted(encryptedPrivateKey: string): Keypair {
  console.log("[v0] Reconstructing keypair from encrypted key...")
  const privateKey = decryptPrivateKey(encryptedPrivateKey)
  console.log("[v0] Private key decrypted for keypair, length:", privateKey.length)

  const keypair = Keypair.fromSecretKey(privateKey)
  console.log("[v0] Keypair reconstructed, public key:", keypair.publicKey.toBase58())

  return keypair
}
