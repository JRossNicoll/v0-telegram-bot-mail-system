import { redis } from "@/lib/redis"

export type StoredMessage = {
  id: string
  from: string
  to: string
  message: string
  signature?: string
  isOnchain: boolean
  isRead: boolean
  timestamp: number
}

// Save a message for sender + receiver
export async function saveMessage(
  from: string,
  to: string,
  message: string,
  signature?: string
) {
  const id = crypto.randomUUID()
  const timestamp = Date.now()

  const payload: StoredMessage = {
    id,
    from,
    to,
    message,
    signature,
    isOnchain: Boolean(signature),
    isRead: false,
    timestamp,
  }

  const stringValue = JSON.stringify(payload)

  // store for receiver
  await redis.lpush(`messages:${to}`, stringValue)

  // also store for sender history
  await redis.lpush(`messages:${from}`, stringValue)

  return id
}

// Fetch messages for a wallet
export async function getMessagesForWallet(wallet: string) {
  const data = await redis.lrange(`messages:${wallet}`, 0, 200)
  return data.map((x) => JSON.parse(x) as StoredMessage)
}

// Mark a message as read
export async function markMessageAsRead(wallet: string, messageId: string) {
  const listKey = `messages:${wallet}`
  const messages = await redis.lrange(listKey, 0, 200)

  for (const raw of messages) {
    const parsed = JSON.parse(raw) as StoredMessage
    if (parsed.id === messageId) {
      parsed.isRead = true
      await redis.lrem(listKey, 1, raw)
      await redis.lpush(listKey, JSON.stringify(parsed))
      return true
    }
  }

  return false
}

// Count unread messages
export async function getUnreadCount(wallet: string) {
  const messages = await getMessagesForWallet(wallet)
  return messages.filter((m) => !m.isRead).length
}
