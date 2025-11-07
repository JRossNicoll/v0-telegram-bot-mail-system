import { redis } from "@/lib/redis";

const THREAD_KEY = "courier:threads";

export async function getConversationPartners(wallet: string) {
  const messages = await redis.lrange("courier:messages", 0, -1);

  const users = new Set<string>();

  for (const m of messages) {
    const msg = JSON.parse(m);
    if (msg.from === wallet) users.add(msg.to);
    if (msg.to === wallet) users.add(msg.from);
  }

  return [...users];
}
