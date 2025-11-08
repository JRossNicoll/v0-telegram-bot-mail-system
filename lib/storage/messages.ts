import { redis } from "@/lib/redis";

export type StoredMessage = {
  id: string;
  from: string;
  to: string;
  message: string;
  signature?: string;
  isOnchain: boolean;
  isRead: boolean;
  createdAt: number;
};

const KEY_MSGS_FOR_WALLET = (wallet: string) => `wallet:${wallet}:msgs`;
const KEY_UNREAD_COUNT = (wallet: string) => `wallet:${wallet}:unread`;

export async function saveMessage(
  from: string,
  to: string,
  message: string,
  signature?: string,
  isOnchain = false
) {
  const now = Date.now();
  const id = `msg_${now}_${Math.random().toString(36).slice(2, 8)}`;
  const obj: StoredMessage = {
    id, from, to, message, signature, isOnchain, isRead: false, createdAt: now
  };
  await redis.lpush(KEY_MSGS_FOR_WALLET(to), JSON.stringify(obj));
  await redis.hincrby(KEY_UNREAD_COUNT(to), "count", 1);
  return obj;
}

export async function getMessagesForWallet(wallet: string) {
  const raw = await redis.lrange(KEY_MSGS_FOR_WALLET(wallet), 0, 50);
  if (!Array.isArray(raw)) return [];
  return raw.map((r: string) => {
    try { return JSON.parse(r) as StoredMessage } catch { return null }
  }).filter(Boolean) as StoredMessage[];
}

export async function getUnreadCount(wallet: string) {
  const c = await redis.hget(KEY_UNREAD_COUNT(wallet), "count");
  return Number(c || 0);
}

export async function markRead(wallet: string, id: string) {
  // naive: fetch, replace first occurrence with isRead=true, decrement counter
  const list = await getMessagesForWallet(wallet);
  let changed = false;
  const updated = list.map(m => {
    if (!m.isRead && m.id === id) { changed = true; return { ...m, isRead: true } }
    return m;
  });
  if (changed) {
    // Overwrite the list (simple but effective for MVP)
    // NOTE: Upstash REST doesn't support MULTI here; for production, use ID-indexed hash/set.
    await redis.del(KEY_MSGS_FOR_WALLET(wallet));
    for (const m of updated.reverse()) {
      await redis.lpush(KEY_MSGS_FOR_WALLET(wallet), JSON.stringify(m));
    }
    await redis.hincrby(KEY_UNREAD_COUNT(wallet), "count", -1);
  }
  return changed;
}
// ✅ Alias to match app's expected function name
export async function getMessagesForUser(wallet: string) {
  return getMessagesForWallet(wallet);
}
