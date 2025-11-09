"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { Loader2, Wallet, PlugZap } from "lucide-react"
import { useEffect, useState } from "react"

const PHANTOM_DOWNLOAD_URL = "https://phantom.app/download"

export function WalletConnectButton() {
  const { connect, connecting, connected, publicKey, wallets, select } = useWallet()
  const [phantomAvailable, setPhantomAvailable] = useState(true)

  useEffect(() => {
    const hasPhantom = typeof window !== "undefined" && window.solana?.isPhantom
    setPhantomAvailable(Boolean(hasPhantom))
  }, [])

  const handleConnect = async () => {
    try {
      // Find Phantom wallet
      const phantomWallet = wallets.find((w) => w.adapter.name === "Phantom")
      if (phantomWallet) {
        select(phantomWallet.adapter.name)
        await connect()
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    }
  }

  if (connected && publicKey) {
    return (
      <div className="w-full flex flex-col items-center gap-3">
        <div className="w-full h-[52px] bg-[#16CE5E] text-white font-bold text-[15px] rounded-[14px] shadow-[0_8px_24px_rgba(22,206,94,0.35),0_4px_12px_rgba(0,0,0,0.12)] flex items-center justify-center gap-2">
          <Wallet className="h-5 w-5" />
          Connected
        </div>
        <p className="text-xs text-green-600 font-medium">
          {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-6)}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="w-full h-[52px] bg-[#16CE5E] hover:bg-[#14B854] text-white font-bold text-[15px] rounded-[14px] shadow-[0_8px_24px_rgba(22,206,94,0.35),0_4px_12px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_32px_rgba(22,206,94,0.45),0_6px_16px_rgba(0,0,0,0.16)] transition-all flex items-center justify-center gap-2 hover:translate-y-[-1px] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {connecting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="h-5 w-5" />
            Connect Phantom
          </>
        )}
      </button>

      {!phantomAvailable && !connected && (
        <a
          href={PHANTOM_DOWNLOAD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#16CE5E] hover:text-[#14B854]"
        >
          <PlugZap className="h-4 w-4" />
          Install Phantom Wallet
        </a>
      )}
    </div>
  )
}
