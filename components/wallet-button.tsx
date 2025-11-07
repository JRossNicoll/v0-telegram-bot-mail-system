"use client";

import React, { useMemo, useCallback } from "react";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet
} from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import "@solana/wallet-adapter-react-ui/styles.css";

// Small internal button for connect/disconnect
function InnerWalletButton() {
  const { connected, connecting, connect, disconnect, publicKey } = useWallet();

  const onConnect = useCallback(async () => {
    try {
      await connect();
      // Optionally tell backend that this wallet is "active"
      if (publicKey) {
        await fetch("/api/wallet/connected", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: publicKey.toBase58() })
        });
      }
    } catch (e) {
      console.error("Wallet connect error:", e);
      alert("Could not log in with wallet.");
    }
  }, [connect, publicKey]);

  const onDisconnect = useCallback(async () => {
    try {
      await disconnect();
    } catch (e) {
      console.error("Wallet disconnect error:", e);
    }
  }, [disconnect]);

  return (
    <button
      onClick={connected ? onDisconnect : onConnect}
      disabled={connecting}
      className="px-4 py-2 rounded-xl border border-black/10 shadow-sm hover:shadow transition"
    >
      {connecting ? "Connecting…" : connected ? `Disconnect ${publicKey?.toBase58().slice(0, 4)}…` : "Connect Phantom"}
    </button>
  );
}

// Exported component you can drop anywhere in your UI
export default function WalletButton() {
  const network = WalletAdapterNetwork.Mainnet; // or Devnet/Testnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <InnerWalletButton />
      </WalletProvider>
    </ConnectionProvider>
  );
}
