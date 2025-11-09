const UPSTASH_URL = process.env.KV_REST_API_URL!
const UPSTASH_TOKEN = process.env.KV_REST_API_TOKEN!

async function upstash(command: string[], cache = "no-store") {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) throw new Error("Redis env not set")
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
  const data = await res.json()
  if (data.error) {
    throw new Error(data.error || "Redis error")
  }
  return data.result
}

export const redis = {
  // Strings
  async get(key: string) {
    return upstash(["GET", key])
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
  async lrange(key: string, start = 0, stop = -1) {
    return upstash(["LRANGE", key, String(start), String(stop)])
  },
  // Hashes
  async hincrby(key: string, field: string, by: number) {
    return upstash(["HINCRBY", key, field, String(by)])
  },
  async hget(key: string, field: string) {
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
