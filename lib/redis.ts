const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL!;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;

// Minimal REST helper. If you prefer the official SDK, swap it in.
async function upstash(command: string[], cache = "no-store") {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) throw new Error("Redis env not set");
  const res = await fetch(`${UPSTASH_URL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([command]),
    cache,
    next: { revalidate: 0 },
  });
  const data = await res.json();
  if (!Array.isArray(data) || !data[0] || data[0].error) {
    throw new Error(data[0]?.error || "Redis error");
  }
  return data[0].result;
}

export const redis = {
  // Strings
  async get(key: string) {
    return upstash(["GET", key]);
  },
  async set(key: string, val: string) {
    return upstash(["SET", key, val]);
  },
  async del(key: string) {
    return upstash(["DEL", key]);
  },
  // Lists
  async lpush(key: string, val: string) {
    return upstash(["LPUSH", key, val]);
  },
  async lrange(key: string, start = 0, stop = -1) {
    return upstash(["LRANGE", key, String(start), String(stop)]);
  },
  async hincrby(key: string, field: string, by: number) {
    return upstash(["HINCRBY", key, field, String(by)]);
  },
  async hget(key: string, field: string) {
    return upstash(["HGET", key, field]);
  },
  async hset(key: string, field: string, value: string) {
    return upstash(["HSET", key, field, value]);
  }
};
