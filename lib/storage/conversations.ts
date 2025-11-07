import { redis } from "@/lib/redis"

const conversationKey = (telegramId: string) => `conversation:${telegramId}`

export type ConversationState = {
  step: "awaiting_wallet" | "awaiting_message"
  data: {
    isOnChain?: boolean
    toWallet?: string
  }
  updatedAt: number
}

const CONVERSATION_TTL_SECONDS = 15 * 60

export async function startSendConversation(telegramId: string, isOnChain: boolean) {
  const state: ConversationState = {
    step: "awaiting_wallet",
    data: { isOnChain },
    updatedAt: Date.now(),
  }

  await redis.set(conversationKey(telegramId), JSON.stringify(state), {
    ex: CONVERSATION_TTL_SECONDS,
  })
}

export async function getConversationState(telegramId: string): Promise<ConversationState | null> {
  const raw = await redis.get<string>(conversationKey(telegramId))
  if (!raw) return null

  try {
    return JSON.parse(raw) as ConversationState
  } catch (error) {
    console.error("[storage] Failed to parse conversation state", telegramId, error)
    return null
  }
}

type ConversationUpdate = {
  step?: ConversationState["step"]
  data?: Partial<ConversationState["data"]>
}

export async function updateConversationState(telegramId: string, update: ConversationUpdate) {
  const existing = (await getConversationState(telegramId)) ?? {
    step: "awaiting_wallet" as const,
    data: {},
    updatedAt: Date.now(),
  }

  const next: ConversationState = {
    step: update.step ?? existing.step,
    data: { ...existing.data, ...update.data },
    updatedAt: Date.now(),
  }

  await redis.set(conversationKey(telegramId), JSON.stringify(next), {
    ex: CONVERSATION_TTL_SECONDS,
  })
}

export async function clearConversation(telegramId: string) {
  await redis.del(conversationKey(telegramId))
}
