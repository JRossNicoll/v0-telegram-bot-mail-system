const UPSTASH_URL = process.env.MAIL_KV_REST_API_URL
const UPSTASH_TOKEN = process.env.MAIL_KV_REST_API_TOKEN

async function upstash(command: string[], cache = "no-store") {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    console.error("[v0] Redis env check failed:", {
      hasMailUrl: !!process.env.MAIL_KV_REST_API_URL,
      hasMailToken: !!process.env.MAIL_KV_REST_API_TOKEN,
      finalUrl: !!UPSTASH_URL,
      finalToken: !!UPSTASH_TOKEN,
    })
    throw new Error(
      "Redis environment variables not configured. Please add MAIL_KV_REST_API_URL and MAIL_KV_REST_API_TOKEN to your environment variables.",
    )
  }

  console.log("[v0] Redis: executing command:", command[0])

  const res = await fetch(`${UPSTASH_URL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache,
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    console.error("[v0] Redis HTTP error:", res.status, res.statusText)
    throw new Error(`Redis request failed: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()

  if (data.error) {
    console.error("[v0] Redis command error:", data.error)
    throw new Error(data.error || "Redis error")
  }

  console.log("[v0] Redis: command successful, result type:", typeof data.result)
  return data.result
}

export const redis = {
  // Strings
  async get<T = string>(key: string): Promise<T | null> {
    const result = await upstash(["GET", key])
    return result as T | null
  },
  async set(key: string, val: string) {
    return upstash(["SET", key, val])
  },
  async del(key: string) {
    return upstash(["DEL", key])
  },
  // Lists
  async lpush(key: string, val: string) {
    return upstash(["LPUSH", key, val])
  },
  async lrange(key: string, start = 0, stop = -1): Promise<string[]> {
    const result = await upstash(["LRANGE", key, String(start), String(stop)])
    return Array.isArray(result) ? result : []
  },
  // Hashes
  async hincrby(key: string, field: string, by: number) {
    return upstash(["HINCRBY", key, field, String(by)])
  },
  async hget(key: string, field: string): Promise<string | null> {
    return upstash(["HGET", key, field])
  },
  async hgetall(key: string) {
    const result = await upstash(["HGETALL", key])
    if (!Array.isArray(result)) return {}
    const obj: Record<string, string> = {}
    for (let i = 0; i < result.length; i += 2) {
      obj[result[i]] = result[i + 1]
    }
    return obj
  },
  async hset(key: string, data: Record<string, string>) {
    const args = ["HSET", key]
    for (const [k, v] of Object.entries(data)) {
      args.push(k, v)
    }
    return upstash(args)
  },
  // Other
  async keys(pattern: string) {
    return upstash(["KEYS", pattern])
  },
  async expire(key: string, seconds: number) {
    return upstash(["EXPIRE", key, String(seconds)])
  },
}
