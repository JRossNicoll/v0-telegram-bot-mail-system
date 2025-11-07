import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { connectWallet, getUser, getTelegramIdByWallet } from "@/lib/storage/users"

export async function GET() {
  try {
    const testId = "test-user-123"
    const testWallet = "TestWalletAddress123"
    const testPrivateKey = "TestEncryptedPrivateKey123"

    await redis.set("test-key", "test-value", { ex: 30 })
    const directValue = await redis.get("test-key")

    await connectWallet(testId, testWallet, testPrivateKey)

    const retrievedUser = await getUser(testId)
    const walletLookup = await getTelegramIdByWallet(testWallet)

    const storedByTelegram = await redis.get(`user:telegram:${testId}`)
    const storedByWallet = await redis.get(`user:wallet:${testWallet}`)

    return NextResponse.json({
      success: true,
      tests: {
        directRedis: directValue === "test-value",
        retrievedUser,
        walletLookup,
        storedByTelegram,
        storedByWallet,
      },
    })
  } catch (error) {
    console.error("[v0] Redis test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
