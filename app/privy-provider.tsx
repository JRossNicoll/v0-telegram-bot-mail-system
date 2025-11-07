"use client"

import { PrivyProvider, type PrivyClientConfig } from "@privy-io/react-auth"
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana"
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

type SolanaChainConfig = {
  id: string
  type: "solana"
  name: string
}

const SOLANA_CHAINS: SolanaChainConfig[] = [
  { id: "solana:mainnet", type: "solana", name: "Solana Mainnet" },
  { id: "solana:devnet", type: "solana", name: "Solana Devnet" },
]

function normalizeDomain(value: string | undefined) {
  if (!value) return undefined

  try {
    const url = value.includes("://") ? new URL(value) : new URL(`https://${value}`)
    return url.hostname
  } catch (error) {
    console.warn("[Privy] Failed to normalize SIWS domain:", error)
    return value
  }
}

export default function PrivyProviderWrapper({ children }: { children: ReactNode }) {
  const solanaConnectors = useMemo(() => toSolanaWalletConnectors({ shouldAutoConnect: false }), [])
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
  const initialDomain = normalizeDomain(
    process.env.NEXT_PUBLIC_PRIVY_DOMAIN ??
      process.env.NEXT_PUBLIC_APP_DOMAIN ??
      process.env.NEXT_PUBLIC_SITE_DOMAIN ??
      process.env.NEXT_PUBLIC_VERCEL_URL,
  )
  const [siwsDomain, setSiwsDomain] = useState<string | undefined>(initialDomain)

  useEffect(() => {
    if (!siwsDomain && typeof window !== "undefined") {
      setSiwsDomain(window.location.hostname)
    }
  }, [siwsDomain])

  const config = useMemo(() => {
    const baseConfig = {
      loginMethods: ["wallet"],
      appearance: {
        theme: "dark",
        accentColor: "#16CE5E",
        walletChainType: "solana-only",
      },
      embeddedWallets: {
        ethereum: { createOnLogin: "off" },
        solana: { createOnLogin: "off" },
      },
      externalWallets: {
        solana: {
          connectors: solanaConnectors,
        },
      },
      supportedChains: SOLANA_CHAINS as unknown as PrivyClientConfig["supportedChains"],
      siws: {
        statement: "Sign in to Courier",
        ...(siwsDomain ? { domain: siwsDomain } : {}),
      },
    } satisfies Record<string, unknown>

    return baseConfig as PrivyClientConfig
  }, [siwsDomain, solanaConnectors])

  if (!appId) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Privy] NEXT_PUBLIC_PRIVY_APP_ID is not set. Rendering children without PrivyProvider.")
    }
    return <>{children}</>
  }

  return (
    <PrivyProvider appId={appId} config={config}>
      {children}
    </PrivyProvider>
  )
}
