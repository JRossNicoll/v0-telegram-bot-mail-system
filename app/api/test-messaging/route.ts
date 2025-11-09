import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export async function GET() {
  try {
    // Test Redis connection
    const testKey = "test:connection"
    await redis.set(testKey, "working", { ex: 60 })
    const testValue = await redis.get(testKey)

    // Check environment variables
    const envCheck = {
      redisUrl: !!process.env.KV_REST_API_URL,
      redisToken: !!process.env.KV_REST_API_TOKEN,
      solanaRpc: !!process.env.NEXT_PUBLIC_SOLANA_RPC,
      telegramToken: !!process.env.TELEGRAM_BOT_TOKEN,
      appUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    }

    return NextResponse.json({
      status: "ok",
      redis: testValue === "working" ? "connected" : "error",
      environment: envCheck,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Test messaging error:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
