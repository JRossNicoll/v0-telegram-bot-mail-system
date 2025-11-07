import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import bs58 from "bs58";
import { saveMessage } from "@/lib/storage/messages";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("courier_user");

    if (!userCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { toWallet, message, signature } = await req.json();
    if (!toWallet || !message || !signature) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { publicKey: fromWallet } = JSON.parse(userCookie.value);

    // Verify signature
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || clusterApiUrl("mainnet-beta"),
      "confirmed"
    );

    const pubKey = new PublicKey(fromWallet);
    const sigBytes = bs58.decode(signature);

    const isValidSignature = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      await crypto.subtle.importKey(
        "raw",
        pubKey.toBytes(),
        { name: "ECDSA", namedCurve: "P-256" },
        false,
        ["verify"]
      ),
      sigBytes,
      new TextEncoder().encode(message)
    );

    if (!isValidSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // Save message into DB
    await saveMessage({
      from: fromWallet,
      to: toWallet,
      message,
      signature,
      isOnchain: true,
      isRead: false
    });

    return NextResponse.json({
      success: true,
      message: "Message sent and verified on-chain."
    });
  } catch (err) {
    console.error("send-onchain error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
