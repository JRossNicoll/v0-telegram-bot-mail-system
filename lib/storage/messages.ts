import { redis } from "@/lib/redis";

const MESSAGES_KEY = "courier:messages";

export type MessageRecord = {
  id: string;
  from: string;
  to: string;
  message: string;
  signature?: string;
  isOnchain?: boolean;
  isRead?: boolean;
  createdAt: number;
};

export async function saveMessage(
  from: string,
  to: string,
  message: string,
  signature?: string,
  isOnchain: boolean = false
) {
  const msg: MessageRecord = {
    id: crypto.randomUUID(),
    from,
    to,
    message,
    signature,
    isOnchain,
    isRead: false,
    createdAt: Date.now(),
  };

  await redis.lpush(MESSAGES_KEY, JSON.stringify(msg));
  return msg;
}

export async function getMessagesForUser(wallet: string) {
  const messages = await redis.lrange(MESSAGES_KEY, 0, -1);
  return messages
    .map((m) => JSON.parse(m) as MessageRecord)
    .filter((m) => m.to === wallet || m.from === wallet)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function markRead(id: string) {
  const messages = await redis.lrange(MESSAGES_KEY, 0, -1);

  for (const m of messages) {
    const parsed = JSON.parse(m) as MessageRecord;
    if (parsed.id === id) {
      parsed.isRead = true;
      await redis.lrem(MESSAGES_KEY, 1, m);
      await redis.lpush(MESSAGES_KEY, JSON.stringify(parsed));
      return true;
    }
  }
  return false;
}
