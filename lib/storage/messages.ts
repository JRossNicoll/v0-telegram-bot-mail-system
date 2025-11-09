import { redis } from "@/lib/redis"

export type StoredMessage = {
  id: string
  from: string
  to: string
  message: string
  signature?: string
  onChain: boolean
  isRead: boolean
  timestamp: number
}

const KEY_MSGS_FOR_WALLET = (wallet: string) => `wallet:${wallet}:msgs`
const KEY_UNREAD_COUNT = (wallet: string) => `wallet:${wallet}:unread`

export async function saveMessage(
  fromOrObject: string | { from: string; to: string; message: string; onChain?: boolean; txSignature?: string },
  to?: string,
  message?: string,
  signature?: string,
  isOnchain?: boolean,
): Promise<StoredMessage> {
  console.log("[v0] 💾 saveMessage called with:", typeof fromOrObject === "object" ? "object" : "params")

  let from: string
  let actualTo: string
  let actualMessage: string
  let actualSignature: string | undefined
  let actualOnChain: boolean

  // Handle both object and parameter-based calls
  if (typeof fromOrObject === "object") {
    from = fromOrObject.from
    actualTo = fromOrObject.to
    actualMessage = fromOrObject.message
    actualSignature = fromOrObject.txSignature
    actualOnChain = fromOrObject.onChain || false
  } else {
    from = fromOrObject
    actualTo = to!
    actualMessage = message!
    actualSignature = signature
    actualOnChain = isOnchain || false
  }

  console.log("[v0] 📨 Message details:")
  console.log("[v0] - From:", from.substring(0, 8) + "...")
  console.log("[v0] - To:", actualTo.substring(0, 8) + "...")
  console.log("[v0] - On-chain:", actualOnChain)
  console.log("[v0] - Has signature:", !!actualSignature)

  const now = Date.now()
  const id = `msg_${now}_${Math.random().toString(36).slice(2, 8)}`

  const obj: StoredMessage = {
    id,
    from,
    to: actualTo,
    message: actualMessage,
    signature: actualSignature,
    onChain: actualOnChain,
    isRead: false,
    timestamp: now,
  }

  console.log("[v0] 💾 Pushing message to Redis list...")
  await redis.lpush(KEY_MSGS_FOR_WALLET(actualTo), JSON.stringify(obj))

  console.log("[v0] 📊 Incrementing unread count...")
  await redis.hincrby(KEY_UNREAD_COUNT(actualTo), "count", 1)

  console.log("[v0] ✅ Message saved successfully!")

  return obj
}

export async function getMessagesForWallet(wallet: string): Promise<StoredMessage[]> {
  const raw = await redis.lrange(KEY_MSGS_FOR_WALLET(wallet), 0, 50)
  if (!Array.isArray(raw)) return []

  return raw
    .map((r: string) => {
      try {
        return JSON.parse(r) as StoredMessage
      } catch {
        return null
      }
    })
    .filter(Boolean) as StoredMessage[]
}

export async function getUnreadCount(wallet: string): Promise<number> {
  const c = await redis.hget(KEY_UNREAD_COUNT(wallet), "count")
  return Number(c || 0)
}

export async function markRead(wallet: string, id: string): Promise<boolean> {
  const list = await getMessagesForWallet(wallet)
  let changed = false
  const updated = list.map((m) => {
    if (!m.isRead && m.id === id) {
      changed = true
      return { ...m, isRead: true }
    }
    return m
  })

  if (changed) {
    await redis.del(KEY_MSGS_FOR_WALLET(wallet))
    for (const m of updated.reverse()) {
      await redis.lpush(KEY_MSGS_FOR_WALLET(wallet), JSON.stringify(m))
    }
    await redis.hincrby(KEY_UNREAD_COUNT(wallet), "count", -1)
  }

  return changed
}
