import { redis } from "@/lib/redis"

type ConvState = {
  from: string
  to: string
  active: boolean
  lastMessageAt: number
}

// Start a conversation state
export async function startSendConversation(from: string, to: string) {
  await redis.set(
    `conv:${from}:${to}`,
    JSON.stringify({
      from,
      to,
      active: true,
      lastMessageAt: Date.now(),
    })
  )
}

// Get current conversation state
export async function getConversationState(from: string, to: string) {
  const raw = await redis.get(`conv:${from}:${to}`)
  if (!raw) return null
  return JSON.parse(raw) as ConvState
}

// Update convo timestamp / data
export async function updateConversationState(from: string, to: string) {
  await redis.set(
    `conv:${from}:${to}`,
    JSON.stringify({
      from,
      to,
      active: true,
      lastMessageAt: Date.now(),
    })
  )
}

// Reset conversation
export async function clearConversation(from: string, to: string) {
  await redis.del(`conv:${from}:${to}`)
}

// List conversation partners
export async function getConversationPartners(wallet: string) {
  const keys = await redis.keys(`conv:${wallet}:*`)
  return keys.map((key) => key.split(":")[2])
}
