"use client"

import { useWallets, useLoginWithSiws } from "@privy-io/react-auth"

type SolanaWallet = {
  address: string
  sign: (message: string) => Promise<string>
  chainId?: string | number
  chain?: string
  type?: string
  chainType?: string
}

export const useSolanaLogin = () => {
  const { wallets } = useWallets()
  const { generateSiwsMessage, loginWithSiws } = useLoginWithSiws()

  const login = async () => {
    const solanaWallet = wallets.find((wallet) => {
      const candidate = wallet as unknown as SolanaWallet
      const chain = candidate.chain ?? candidate.type ?? candidate.chainType
      return chain === "solana"
    }) as unknown as SolanaWallet | undefined

    if (!solanaWallet) {
      return
    }

    const rawChainId = solanaWallet.chainId ?? "mainnet"
    const caipChainId = String(rawChainId).startsWith("solana:")
      ? String(rawChainId)
      : `solana:${rawChainId}`

    const message = await generateSiwsMessage({
      address: solanaWallet.address,
      chainId: caipChainId,
    })

    const signature = await solanaWallet.sign(message)
    return loginWithSiws({ message, signature })
  }

  return { login }
}
