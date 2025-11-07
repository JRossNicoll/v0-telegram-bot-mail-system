"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import type React from "react";

const solanaConnectors: ReturnType<typeof toSolanaWalletConnectors> =
  typeof window !== "undefined"
    ? toSolanaWalletConnectors({ shouldAutoConnect: false })
    : [];

export function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ["wallet"],
        defaultChain: "solana",
        supportedChains: ["solana"],
        embeddedWallets: { solana: true, evm: false },
        externalWallets: {
          solana: { connectors: solanaConnectors },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
