import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { connectWallet, getUser } from "@/lib/storage/users"

export async function GET() {
  try {
    const testId = "test-user-123"
    const testWallet = "TestWalletAddress123"
    const testPrivateKey = "TestEncryptedPrivateKey123"

    // Test 1: Direct Redis connection
    console.log("[v0] Testing direct Redis connection...")
    await redis.set("test-key", "test-value")
    const testValue = await redis.get("test-key")
    console.log("[v0] Direct Redis test result:", testValue)

    // Test 2: Store user with connectWallet
    console.log("[v0] Testing connectWallet...")
    await connectWallet(testId, testWallet, testPrivateKey)
    console.log("[v0] connectWallet completed")

    // Test 3: Retrieve user with getUser
    console.log("[v0] Testing getUser...")
    const retrievedUser = await getUser(testId)
    console.log("[v0] getUser result:", retrievedUser)

    // Test 4: Check what's actually in Redis
    console.log("[v0] Checking Redis hash...")
    const allUsers = await redis.hgetall("users")
    console.log("[v0] All users in Redis:", allUsers)

    // Test 5: Test with your actual Telegram ID
    const yourId = "5445030891"
    console.log("[v0] Checking your actual ID:", yourId)
    const yourUser = await getUser(yourId)
    console.log("[v0] Your user data:", yourUser)

    return NextResponse.json({
      success: true,
      tests: {
        directRedis: testValue === "test-value",
        connectWallet: "completed",
        getUser: retrievedUser,
        allUsers: allUsers,
        yourUser: yourUser,
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
