"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolanaWalletAdapterBase } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";
import { useMemo } from "react";

export default function PrivyProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const solanaWallets = useMemo(() => {
    const phantom = new PhantomWalletAdapter();
    return [phantom as SolanaWalletAdapterBase];
  }, []);

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#ffffff",
        },
        loginMethods: ["wallet"],
        walletConnectors: [],
        externalWallets: {
          solana: {
            connectors: solanaWallets,
            defaultChain: {
              id: "solana-devnet",
              rpcUrl: clusterApiUrl("devnet"),
            },
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
