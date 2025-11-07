import { redis } from "@/lib/redis"

const telegramKey = (telegramId: string) => `user:telegram:${telegramId}`
const walletKey = (wallet: string) => `user:wallet:${wallet}`

export interface StoredUser {
  telegramId: string
  walletAddress: string
  encryptedPrivateKey?: string
  connectedAt: number
}

export async function connectWallet(
  telegramId: string,
  walletAddress: string,
  encryptedPrivateKey?: string,
): Promise<void> {
  const user: StoredUser = {
    telegramId,
    walletAddress,
    encryptedPrivateKey,
    connectedAt: Date.now(),
  }

  await Promise.all([
    redis.set(telegramKey(telegramId), JSON.stringify(user)),
    redis.set(walletKey(walletAddress), JSON.stringify(user)),
  ])
}

export async function getUser(telegramId: string): Promise<StoredUser | null> {
  const raw = await redis.get<string>(telegramKey(telegramId))
  if (!raw) return null

  try {
    return JSON.parse(raw) as StoredUser
  } catch (error) {
    console.error("[storage] Failed to parse user for Telegram ID", telegramId, error)
    return null
  }
}

export async function saveUserWallet(telegramId: string, walletAddress: string): Promise<void> {
  const existing = await getUser(telegramId)
  await connectWallet(telegramId, walletAddress, existing?.encryptedPrivateKey)
}

export async function getUserWallet(telegramId: string): Promise<string | null> {
  const user = await getUser(telegramId)
  return user?.walletAddress ?? null
}

export async function getEncryptedPrivateKey(telegramId: string): Promise<string | null> {
  const user = await getUser(telegramId)
  return user?.encryptedPrivateKey ?? null
}

export async function getTelegramIdByWallet(walletAddress: string): Promise<string | null> {
  const raw = await redis.get<string>(walletKey(walletAddress))
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as StoredUser
    return parsed.telegramId
  } catch (error) {
    console.error("[storage] Failed to parse wallet mapping", walletAddress, error)
    return null
  }
}
