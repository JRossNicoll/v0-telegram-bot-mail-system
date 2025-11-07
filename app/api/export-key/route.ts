import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import CryptoJS from "crypto-js";
import bs58 from "bs58";

// Utility to decrypt the private key
function decryptPrivateKey(encryptedKey: string) {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error("Encryption secret is not configured.");
  }

  const bytes = CryptoJS.AES.decrypt(encryptedKey, secret);
  const decryptedKey = bytes.toString(CryptoJS.enc.Utf8);

  if (!decryptedKey) {
    throw new Error("Failed to decrypt private key.");
  }

  return Uint8Array.from(JSON.parse(decryptedKey));
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const userCookie = cookieStore.get("courier_user");

    if (!userCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = JSON.parse(userCookie.value);

    // ✅ Fix: ensure encrypted private key exists
    if (!user.encryptedPrivateKey) {
      return NextResponse.json(
        { error: "User has no encrypted private key stored" },
        { status: 400 }
      );
    }

    // ✅ TS-safe decryption
    const privateKeyBytes = decryptPrivateKey(user.encryptedPrivateKey as string);

    const privateKeyBase58 = bs58.encode(privateKeyBytes);

    return NextResponse.json({ privateKey: privateKeyBase58 });
  } catch (err: any) {
    console.error("Export key error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
