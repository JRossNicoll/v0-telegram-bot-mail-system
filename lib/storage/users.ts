import { redis } from "@/lib/redis";

const KEY_WALLET_BY_TG = (tgId: number) => `tg:${tgId}:wallet`;
const KEY_TG_BY_WALLET = (wallet: string) => `wallet:${wallet}:tg`;
const KEY_USER = (wallet: string) => `user:${wallet}`;

export async function connectWallet(tgId: number, wallet: string) {
  await redis.set(KEY_WALLET_BY_TG(tgId), wallet);
  await redis.set(KEY_TG_BY_WALLET(wallet), String(tgId));
  await redis.hset(KEY_USER(wallet), { wallet });
}

export async function getWalletByTelegramId(tgId: number) {
  const w = await redis.get(KEY_WALLET_BY_TG(tgId));
  return w ?? null;
}

export async function getTelegramIdByWallet(wallet: string) {
  const id = await redis.get(KEY_TG_BY_WALLET(wallet));
  return id ? Number(id) : null;
}

// ✅ required by app — returns user object shape
export async function getUser(wallet: string) {
  const data = await redis.hgetall(KEY_USER(wallet));
  if (!data || !data.wallet) return null;

  return {
    wallet: data.wallet,
    telegramId: data.telegramId ? Number(data.telegramId) : null,
  };
}

// ✅ compatibility stub — we decrypt later once system is stable
export async function getEncryptedPrivateKey(wallet: string) {
  const key = await redis.hget(KEY_USER(wallet), "encryptedPrivateKey");
  return key ?? null;
}

export async function saveEncryptedPrivateKey(wallet: string, encrypted: string) {
  await redis.hset(KEY_USER(wallet), { encryptedPrivateKey: encrypted });
}
