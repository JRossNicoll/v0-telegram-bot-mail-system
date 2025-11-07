import { redis } from "@/lib/redis"

export interface Message {
  from: string
  to: string
  message: string
  timestamp: number
  onChain: boolean
  txSignature?: string
  read?: boolean
  id?: string
}

export async function saveMessage(
  from: string,
  to: string,
  message: string,
  onChain: boolean,
  txSignature?: string,
): Promise<void> {
  const msg: Message = {
    from,
    to,
    message,
    timestamp: Date.now(),
    onChain,
    txSignature,
    read: false,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  }

  await redis.lpush(`messages:${to}`, JSON.stringify(msg))
  await redis.lpush("messages:all", JSON.stringify(msg))
}

export async function markMessageAsRead(wallet: string, messageId: string): Promise<void> {
  const messages = await redis.lrange<string>(`messages:${wallet}`, 0, -1)

  if (!messages || messages.length === 0) return

  const updatedMessages = messages.map((msgStr) => {
    try {
      const msg = JSON.parse(msgStr)
      if (msg.id === messageId) {
        msg.read = true
      }
      return JSON.stringify(msg)
    } catch {
      return msgStr
    }
  })

  await redis.del(`messages:${wallet}`)
  for (const msgStr of updatedMessages.reverse()) {
    await redis.lpush(`messages:${wallet}`, msgStr)
  }
}

export async function getUnreadCount(wallet: string): Promise<number> {
  const messages = await redis.lrange<string>(`messages:${wallet}`, 0, -1)

  if (!messages || messages.length === 0) return 0

  return messages.filter((msgStr) => {
    try {
      const msg = JSON.parse(msgStr)
      return msg.read === false
    } catch {
      return false
    }
  }).length
}

export async function getMessagesForWallet(wallet: string): Promise<Message[]> {
  const messages = await redis.lrange<string>(`messages:${wallet}`, 0, -1)

  if (!messages || messages.length === 0) return []

  return messages
    .map((msgStr) => {
      try {
        return JSON.parse(msgStr)
      } catch {
        return null
      }
    })
    .filter((msg): msg is Message => msg !== null)
}

export const getMessagesByWallet = getMessagesForWallet

export async function getAllMessages(): Promise<Message[]> {
  const messages = await redis.lrange<string>("messages:all", 0, -1)

  if (!messages || messages.length === 0) return []

  return messages
    .map((msgStr) => {
      try {
        return JSON.parse(msgStr)
      } catch {
        return null
      }
    })
    .filter((msg): msg is Message => msg !== null)
}
