import { redis } from "@/lib/redis"

interface ConversationState {
  userId: string
  step: "awaiting_wallet" | "awaiting_message"
  data: {
    toWallet?: string
    isOnChain?: boolean
  }
}

export async function startSendConversation(userId: string, isOnChain = false): Promise<void> {
  const state: ConversationState = {
    userId,
    step: "awaiting_wallet",
    data: { isOnChain },
  }
  await redis.set(`conversation:${userId}`, JSON.stringify(state), { ex: 3600 })
}

export async function getConversationState(userId: string): Promise<ConversationState | undefined> {
  const stateStr = await redis.get<string>(`conversation:${userId}`)

  if (!stateStr) return undefined

  try {
    return typeof stateStr === "string" ? JSON.parse(stateStr) : stateStr
  } catch {
    return undefined
  }
}

export async function updateConversationState(userId: string, updates: Partial<ConversationState>): Promise<void> {
  const current = await getConversationState(userId)

  if (current) {
    const updated = { ...current, ...updates }
    await redis.set(`conversation:${userId}`, JSON.stringify(updated), { ex: 3600 })
  }
}

export async function clearConversation(userId: string): Promise<void> {
  await redis.del(`conversation:${userId}`)
}
