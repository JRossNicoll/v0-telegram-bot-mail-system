import { redis } from "@/lib/redis";

const KEY_WALLET_BY_TG = (tgId: number) => `tg:${tgId}:wallet`;
const KEY_TG_BY_WALLET = (wallet: string) => `wallet:${wallet}:tg`;

export async function connectWallet(tgId: number, wallet: string) {
  await redis.set(KEY_WALLET_BY_TG(tgId), wallet);
  await redis.set(KEY_TG_BY_WALLET(wallet), String(tgId));
}

export async function getWalletByTelegramId(tgId: number) {
  const w = await redis.get(KEY_WALLET_BY_TG(tgId));
  return w ?? null;
}

export async function getTelegramIdByWallet(wallet: string) {
  const id = await redis.get(KEY_TG_BY_WALLET(wallet));
  return id ? Number(id) : null;
}

// ✅ Polyfills to match expected API surface

// "User" here = Telegram-linked wallet user record
export async function getUser(wallet: string) {
  const tgId = await getTelegramIdByWallet(wallet);
  if (!tgId) return null;

  return {
    wallet,
    telegramId: tgId,
    encryptedPrivateKey: null  // not implemented yet
  };
}

// Placeholder — your app expects this but you store no private key
export async function getEncryptedPrivateKey(wallet: string) {
  return null;
}
