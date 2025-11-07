import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import CryptoJS from "crypto-js";
import bs58 from "bs58";

// Utility to decrypt the private key
function decryptPrivateKey(encrypted: string) {
  const key = CryptoJS.enc.Utf8.parse(process.env.ENCRYPTION_KEY || "");
  const decrypted = CryptoJS.AES.decrypt(encrypted, key);
  return Uint8Array.from(decrypted.words, (value) => value & 0xff);
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("courier_user");

    if (!userCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = JSON.parse(userCookie.value);

    if (!user.encryptedPrivateKey) {
      return NextResponse.json({ error: "No private key found" }, { status: 400 });
    }

    // Decrypt
    const privateKeyBytes = decryptPrivateKey(user.encryptedPrivateKey);

    // Convert to base58
    const privateKeyBase58 = bs58.encode(privateKeyBytes);

    return NextResponse.json({ privateKey: privateKeyBase58 });
  } catch (error) {
    console.error("Error exporting key:", error);
    return NextResponse.json({ error: "Failed to export key" }, { status: 500 });
  }
}
