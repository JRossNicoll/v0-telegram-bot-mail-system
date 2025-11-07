"use client"

import { PrivyProvider } from "@privy-io/react-auth"
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana"
import { useMemo, type ReactNode } from "react"

export default function PrivyProviderWrapper({ children }: { children: ReactNode }) {
  const solanaConnectors = useMemo(() => toSolanaWalletConnectors(), [])
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

  if (!appId) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Privy] NEXT_PUBLIC_PRIVY_APP_ID is not set. Rendering children without PrivyProvider.")
    }
    return <>{children}</>
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["wallet"],
        appearance: {
          theme: "dark",
          accentColor: "#8b5cf6",
        },
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}
