"use client"

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { ConnectionProvider, WalletProvider as SolanaWalletAdapterProvider } from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { clusterApiUrl } from "@solana/web3.js"
import { useMemo, type ReactNode, useEffect, useState } from "react"

export function SolanaWalletProvider({ children }: { children: ReactNode }) {
  const network = WalletAdapterNetwork.Mainnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])
  const wallets = useMemo(() => [], [])

  const [autoConnect, setAutoConnect] = useState(false)

  useEffect(() => {
    setAutoConnect(true)
  }, [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletAdapterProvider wallets={wallets} autoConnect={autoConnect}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletAdapterProvider>
    </ConnectionProvider>
  )
}

export { SolanaWalletProvider as WalletProvider }
