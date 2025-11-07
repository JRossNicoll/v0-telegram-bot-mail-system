"use client"

import { PrivyProvider } from "@privy-io/react-auth"
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana"
import type React from "react"

export function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
      config={{
        loginMethods: ["wallet"],
        defaultChain: "solana",
        supportedChains: ["solana"],
        embeddedWallets: { solana: true, evm: false },
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors({
              shouldAutoConnect: false,
            }),
          },
        },
        walletConnectCloudProjectId: undefined,
      }}
    >
      {children}
    </PrivyProvider>
  )
}
