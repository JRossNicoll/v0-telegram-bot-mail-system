"use client"

import { usePrivy } from "@privy-io/react-auth"
import { useWallets } from "@privy-io/react-auth"
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom"
import { useEffect, useState } from "react"

export function WalletConnectButton() {
  const { login, authenticated, user } = usePrivy()
  const { wallets, linkWallet } = useWallets()
  const [phantom, setPhantom] = useState<any>(null)

  useEffect(() => {
    const adapter = new PhantomWalletAdapter()
    setPhantom(adapter)
  }, [])

  async function connectPhantom() {
    if (!phantom) return
    await phantom.connect()
    const publicKey = phantom.publicKey?.toString()
    if (!publicKey) return

    await linkWallet({
      chainType: "solana",
      address: publicKey,
    })
  }

  if (!authenticated) {
    return (
      <button onClick={login} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
        Connect Wallet
      </button>
    )
  }

  const solWallet = wallets?.find((w: any) => w.chainType === "solana")
  return (
    <button
      onClick={!solWallet ? connectPhantom : undefined}
      className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
    >
      {solWallet ? solWallet.address.slice(0, 6) + "..." + solWallet.address.slice(-4) : "Connect Phantom"}
    </button>
  )
}

export default WalletConnectButton
