const UPSTASH_URL = process.env.MAIL_KV_REST_API_URL
const UPSTASH_TOKEN = process.env.MAIL_KV_REST_API_TOKEN

console.log("[v0] ===== REDIS INITIALIZATION =====")
console.log("[v0] Environment check:")
console.log("[v0] - MAIL_KV_REST_API_URL exists:", !!process.env.MAIL_KV_REST_API_URL)
console.log("[v0] - MAIL_KV_REST_API_TOKEN exists:", !!process.env.MAIL_KV_REST_API_TOKEN)
console.log("[v0] - Final URL set:", !!UPSTASH_URL)
console.log("[v0] - Final TOKEN set:", !!UPSTASH_TOKEN)
if (UPSTASH_URL) {
  console.log("[v0] - URL value:", UPSTASH_URL)
}
console.log("[v0] ===================================")

async function upstash(command: string[], cache = "no-store") {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    console.error("[v0] ❌ CRITICAL: Redis environment variables not set!")
    console.error("[v0] Please add these to your Vars:")
    console.error("[v0] - MAIL_KV_REST_API_URL")
    console.error("[v0] - MAIL_KV_REST_API_TOKEN")
    throw new Error("Redis env not set")
  }

  console.log("[v0] 📡 Redis command:", command[0], "→", command[1] || "")

  try {
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
      const text = await res.text()
      console.error("[v0] ❌ Redis HTTP error:", res.status, text)
      throw new Error(`Redis HTTP ${res.status}: ${text}`)
    }

    const data = await res.json()

    if (data.error) {
      console.error("[v0] ❌ Redis command error:", data.error)
      throw new Error(data.error)
    }

    console.log("[v0] ✅ Redis success:", command[0])
    return data.result
  } catch (error) {
    console.error("[v0] ❌ Redis exception:", error)
    throw error
  }
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
