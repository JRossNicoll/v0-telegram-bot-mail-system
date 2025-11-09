import { redis } from "@/lib/redis"

// Keys for different access patterns
const KEY_USER_BY_TG = (tgId: string) => `user:telegram:${tgId}`
const KEY_USER_BY_WALLET = (wallet: string) => `user:wallet:${wallet}`
const KEY_TG_BY_WALLET = (wallet: string) => `wallet:${wallet}:tg`
const KEY_LINK_CODE = (code: string) => `link:code:${code}`

export interface User {
  telegramId?: string
  walletAddress: string
  encryptedPrivateKey?: string
}

export async function connectWallet(telegramId: string, walletAddress: string, encryptedKey?: string) {
  const user: User = {
    telegramId,
    walletAddress,
    ...(encryptedKey && { encryptedPrivateKey: encryptedKey }),
  }

  // Store user data accessible by both Telegram ID and wallet address
  await redis.set(KEY_USER_BY_TG(telegramId), JSON.stringify(user))
  await redis.set(KEY_USER_BY_WALLET(walletAddress), JSON.stringify(user))
  await redis.set(KEY_TG_BY_WALLET(walletAddress), telegramId)
}

export async function getUser(identifier: string): Promise<User | null> {
  // Try to get user by Telegram ID first
  let userData = await redis.get<string>(KEY_USER_BY_TG(identifier))

  // If not found, try by wallet address
  if (!userData) {
    userData = await redis.get<string>(KEY_USER_BY_WALLET(identifier))
  }

  if (!userData) return null

  try {
    return JSON.parse(userData) as User
  } catch (error) {
    console.error("[v0] Failed to parse user data:", error)
    return null
  }
}

export async function getWalletByTelegramId(telegramId: string): Promise<string | null> {
  const user = await getUser(telegramId)
  return user?.walletAddress || null
}

export async function getTelegramIdByWallet(walletAddress: string): Promise<string | null> {
  const tgId = await redis.get<string>(KEY_TG_BY_WALLET(walletAddress))
  return tgId || null
}

export async function getEncryptedPrivateKey(identifier: string): Promise<string | null> {
  const user = await getUser(identifier)
  return user?.encryptedPrivateKey || null
}

export async function saveEncryptedPrivateKey(identifier: string, encryptedKey: string) {
  const user = await getUser(identifier)
  if (!user) return

  user.encryptedPrivateKey = encryptedKey

  // Update both storage locations
  if (user.telegramId) {
    await redis.set(KEY_USER_BY_TG(user.telegramId), JSON.stringify(user))
  }
  await redis.set(KEY_USER_BY_WALLET(user.walletAddress), JSON.stringify(user))
}

export async function generateLinkCode(walletAddress: string): Promise<string> {
  // Generate a 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString()

  // Store the wallet address with the code, expires in 10 minutes
  await redis.set(KEY_LINK_CODE(code), walletAddress)
  await redis.expire(KEY_LINK_CODE(code), 600) // 10 minutes

  return code
}

export async function linkTelegramWithCode(telegramId: number, code: string): Promise<boolean> {
  const walletAddress = await redis.get<string>(KEY_LINK_CODE(code))

  if (!walletAddress) {
    console.error("[v0] Link code not found or expired:", code)
    return false // Code expired or invalid
  }

  console.log("[v0] Link code valid, wallet:", walletAddress)

  // Get existing user by wallet
  let existingUser = await getUser(walletAddress)

  if (!existingUser) {
    console.log("[v0] No existing user, creating new user record for wallet:", walletAddress)
    existingUser = {
      walletAddress,
    }
  }

  console.log("[v0] Linking Telegram ID", telegramId, "to wallet", walletAddress)

  // Link the Telegram ID to the wallet
  await connectWallet(telegramId.toString(), walletAddress, existingUser.encryptedPrivateKey)

  // Delete the used code
  await redis.del(KEY_LINK_CODE(code))

  console.log("[v0] Successfully linked Telegram to wallet")
  return true
}

export async function isWalletLinked(walletAddress: string): Promise<boolean> {
  const tgId = await getTelegramIdByWallet(walletAddress)
  return tgId !== null
}
