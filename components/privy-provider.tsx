"use client"

import { useEffect, useRef } from "react"

import { PrivyProvider, usePrivy, useWallets } from "@privy-io/react-auth"
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana"
import type React from "react"

import { useSolanaLogin } from "@/lib/auth/use-solana-login"

function SolanaSiwsHandler() {
  const { ready, authenticated } = usePrivy()
  const { wallets } = useWallets()
  const { login } = useSolanaLogin()
  const isLoggingIn = useRef(false)

  useEffect(() => {
    if (!ready || authenticated || isLoggingIn.current) {
      return
    }

    const hasConnectedSolanaWallet = wallets.some((wallet) => {
      const chain = (wallet as any).chain ?? wallet.type ?? (wallet as any).chainType
      return chain === "solana"
    })

    if (!hasConnectedSolanaWallet) {
      return
    }

    isLoggingIn.current = true
    login()
      .catch((error) => {
        console.error("[v0] Solana SIWS login failed:", error)
      })
      .finally(() => {
        isLoggingIn.current = false
      })
  }, [ready, authenticated, wallets, login])

  return null
}

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
      <SolanaSiwsHandler />
      {children}
    </PrivyProvider>
  )
}
