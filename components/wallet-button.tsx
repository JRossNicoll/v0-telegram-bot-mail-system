"use client";

import { usePrivy } from "@privy-io/react-auth";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";

export default function ConnectWallet() {
  const { ready, authenticated, login, logout } = usePrivy();

  const connectPhantom = async () => {
    try {
      const phantom = new PhantomWalletAdapter();
      await phantom.connect();

      const publicKey = phantom.publicKey?.toString();
      if (!publicKey) throw new Error("Wallet connection failed");

      const message = `Login to Courier\nWallet: ${publicKey}\nTimestamp: ${Date.now()}`;
      const encoded = new TextEncoder().encode(message);
      const signed = await phantom.signMessage(encoded);

      await login({
        wallet: {
          chain: "solana",
          address: publicKey,
          signature: Buffer.from(signed.signature).toString("base64"),
          message,
        },
      });

      console.log("[✅] Phantom login success");

    } catch (err) {
      console.error("[❌] Wallet login failed:", err);
      alert("Wallet login failed. Check console.");
    }
  };

  if (!ready) return null;

  return (
    <button
      className="px-4 py-2 bg-purple-600 rounded text-white"
      onClick={authenticated ? logout : connectPhantom}
    >
      {authenticated ? "Logout" : "Connect Phantom"}
    </button>
  );
}
