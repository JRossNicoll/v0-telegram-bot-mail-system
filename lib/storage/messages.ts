import { redis } from "@/lib/redis"
import { randomUUID } from "node:crypto"

const inboxKey = (wallet: string) => `inbox:${wallet}`
const threadsKey = (wallet: string) => `threads:${wallet}`

export type StoredMessage = {
  id: string
  from: string
  to: string
  message: string
  timestamp: number
  onChain: boolean
  txSignature?: string
  direction: "inbound" | "outbound"
  isRead: boolean
}

type SaveMessageInput = {
  from: string
  to: string
  message: string
  onChain?: boolean
  txSignature?: string
}

const MAX_MESSAGES_PER_WALLET = 500

async function trimInbox(wallet: string) {
  const key = inboxKey(wallet)
  const total = await redis.zcard(key)
  if (total <= MAX_MESSAGES_PER_WALLET) {
    return
  }

  const overflow = await redis.zrange<string[]>(key, 0, total - MAX_MESSAGES_PER_WALLET - 1)
  if (overflow.length > 0) {
    await redis.zrem(key, ...overflow)
  }
}

export async function saveMessage(input: SaveMessageInput) {
  const { from, to, message, onChain = false, txSignature } = input
  const timestamp = Date.now()
  const id = randomUUID()

  const basePayload = {
    id,
    from,
    to,
    message,
    timestamp,
    onChain,
    txSignature,
  }

  const outbound: StoredMessage = {
    ...basePayload,
    direction: "outbound",
    isRead: true,
  }

  const inbound: StoredMessage = {
    ...basePayload,
    direction: "inbound",
    isRead: false,
  }

  const outboundString = JSON.stringify(outbound)
  const inboundString = JSON.stringify(inbound)

  await Promise.all([
    redis.zadd(inboxKey(from), { score: timestamp, member: outboundString }),
    redis.zadd(inboxKey(to), { score: timestamp, member: inboundString }),
    redis.sadd(threadsKey(from), to),
    redis.sadd(threadsKey(to), from),
  ])

  await Promise.all([trimInbox(from), trimInbox(to)])

  return { outbound, inbound }
}

export async function getMessagesForWallet(wallet: string): Promise<StoredMessage[]> {
  const raw = await redis.zrange<string[]>(inboxKey(wallet), 0, -1, { rev: true })
  const messages: StoredMessage[] = []

  for (const entry of raw) {
    try {
      messages.push(JSON.parse(entry) as StoredMessage)
    } catch (error) {
      console.error("[storage] Failed to parse stored message", { wallet, entry, error })
    }
  }

  return messages
}

export async function markMessageAsRead(wallet: string, messageId: string) {
  const key = inboxKey(wallet)
  const entries = await redis.zrange<string[]>(key, 0, -1)

  for (const entry of entries) {
    const parsed = JSON.parse(entry) as StoredMessage
    if (parsed.id === messageId) {
      if (parsed.isRead) {
        return true
      }

      parsed.isRead = true
      await redis.zrem(key, entry)
      await redis.zadd(key, { score: parsed.timestamp, member: JSON.stringify(parsed) })
      return true
    }
  }

  return false
}

export async function getUnreadCount(wallet: string) {
  const messages = await getMessagesForWallet(wallet)
  return messages.filter((message) => message.direction === "inbound" && !message.isRead).length
}

export async function getConversationThreads(wallet: string) {
  const members = await redis.smembers<string[]>(threadsKey(wallet))
  return members ?? []
}
