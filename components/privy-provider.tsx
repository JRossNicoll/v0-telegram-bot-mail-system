"use client"

import { PrivyProvider as BasePrivyProvider } from "@privy-io/react-auth"
import type { ReactNode } from "react"

export function PrivyProvider({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

  if (!appId) {
    throw new Error("NEXT_PUBLIC_PRIVY_APP_ID is not set")
  }

  return (
    <BasePrivyProvider
      appId={appId}
      config={{
        embeddedWallets: {
          createOnLogin: "off",
        },
        loginMethods: ["wallet"],
        appearance: {
          walletChainType: "solana-only",
          walletList: ["phantom", "solflare", "detected_solana_wallets"],
        },
        supportedChains: [],
      }}
    >
      {children}
    </BasePrivyProvider>
  )
}
