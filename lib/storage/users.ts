import { redis } from "@/lib/redis"

interface UserData {
  walletAddress: string
  encryptedPrivateKey?: string
  connectedAt?: number
}

export async function connectWallet(
  telegramId: string,
  walletAddress: string,
  encryptedPrivateKey?: string,
): Promise<void> {
  console.log("[v0] === connectWallet ===")
  console.log("[v0] Telegram ID:", telegramId)
  console.log("[v0] Wallet Address:", walletAddress)
  console.log("[v0] Has Encrypted Key:", !!encryptedPrivateKey)
  console.log("[v0] Encrypted Key length:", encryptedPrivateKey?.length || 0)

  const userData: UserData = {
    walletAddress,
    encryptedPrivateKey,
    connectedAt: Date.now(),
  }

  const key = `user:${telegramId}`
  console.log("[v0] Storing to Redis key:", key)

  await redis.set(key, JSON.stringify(userData))
  console.log("[v0] Data stored successfully")

  // Verify it was stored
  const verify = await redis.get(key)
  console.log("[v0] Verification - Data retrieved from Redis:", !!verify)
  if (verify) {
    const parsed = typeof verify === "string" ? JSON.parse(verify) : verify
    console.log("[v0] Verification - Parsed data:", {
      walletAddress: parsed.walletAddress,
      hasEncryptedKey: !!parsed.encryptedPrivateKey,
      connectedAt: parsed.connectedAt ? new Date(parsed.connectedAt).toISOString() : "N/A",
    })
  }
  console.log("[v0] =====================")
}

export async function getUser(telegramId: string): Promise<UserData | null> {
  console.log("[v0] === getUser ===")
  console.log("[v0] Looking up Telegram ID:", telegramId)
  console.log("[v0] Redis key:", `user:${telegramId}`)

  const userData = await redis.get<string>(`user:${telegramId}`)
  console.log("[v0] Raw data from Redis:", userData ? "FOUND" : "NOT FOUND")

  if (!userData) {
    console.log("[v0] No user data found")
    console.log("[v0] ==================")
    return null
  }

  try {
    const parsed = typeof userData === "string" ? JSON.parse(userData) : userData
    console.log("[v0] User data parsed successfully:", {
      walletAddress: parsed.walletAddress,
      hasEncryptedKey: !!parsed.encryptedPrivateKey,
      connectedAt: parsed.connectedAt ? new Date(parsed.connectedAt).toISOString() : "N/A",
    })
    console.log("[v0] ==================")
    return parsed
  } catch (error) {
    console.error("[v0] Error parsing user data:", error)
    console.log("[v0] ==================")
    return null
  }
}

export async function saveUserWallet(telegramId: string, walletAddress: string): Promise<void> {
  await redis.set(`user:${telegramId}`, JSON.stringify({ walletAddress }))
}

export async function getUserWallet(telegramId: string): Promise<string | null> {
  const user = await getUser(telegramId)
  return user?.walletAddress || null
}

export async function getEncryptedPrivateKey(telegramId: string): Promise<string | null> {
  const user = await getUser(telegramId)
  return user?.encryptedPrivateKey || null
}

export async function getTelegramIdByWallet(walletAddress: string): Promise<string | null> {
  console.log("[v0] === getTelegramIdByWallet ===")
  console.log("[v0] Looking up wallet:", walletAddress)

  const keys = await redis.keys("user:*")
  console.log("[v0] Total user keys in Redis:", keys?.length || 0)

  if (!keys || keys.length === 0) {
    console.log("[v0] No user keys found in Redis")
    console.log("[v0] =================================")
    return null
  }

  for (const key of keys) {
    try {
      const userDataStr = await redis.get<string>(key)
      if (!userDataStr) continue

      const userData = typeof userDataStr === "string" ? JSON.parse(userDataStr) : userDataStr
      if (userData.walletAddress === walletAddress) {
        const telegramId = key.replace("user:", "")
        console.log("[v0] MATCH FOUND!")
        console.log("[v0] Telegram ID:", telegramId)
        console.log("[v0] Wallet:", userData.walletAddress)
        console.log("[v0] =================================")
        return telegramId
      }
    } catch (error) {
      console.error("[v0] Error parsing user data for key:", key, error)
      continue
    }
  }

  console.log("[v0] No matching wallet found")
  console.log("[v0] =================================")
  return null
}
