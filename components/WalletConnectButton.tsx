"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { Loader2, Wallet, PlugZap } from "lucide-react"
import { useEffect, useState } from "react"

const PHANTOM_DOWNLOAD_URL = "https://phantom.app/download"

export function WalletConnectButton() {
  const { connecting, connected, publicKey, wallet } = useWallet()
  const [phantomAvailable, setPhantomAvailable] = useState(true)

  useEffect(() => {
    const hasPhantom = typeof window !== "undefined" && window.solana?.isPhantom
    setPhantomAvailable(Boolean(hasPhantom))
  }, [])

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <WalletMultiButton className="w-full h-[52px] !bg-[#16CE5E] hover:!bg-[#14B854] !text-[#000000] !font-bold !text-[15px] !rounded-[14px] !shadow-[0_8px_24px_rgba(22,206,94,0.35),0_4px_12px_rgba(0,0,0,0.12)] hover:!shadow-[0_12px_32px_rgba(22,206,94,0.45),0_6px_16px_rgba(0,0,0,0.16)] !transition-all flex items-center justify-center gap-2 hover:!translate-y-[-1px]">
        {connecting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Connecting...
          </>
        ) : !connected ? (
          <>
            <Wallet className="h-5 w-5" />
            Connect Phantom
          </>
        ) : null}
      </WalletMultiButton>

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

      {connected && publicKey && (
        <p className="text-xs text-green-600 font-medium">
          {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-6)}
        </p>
      )}
    </div>
  )
}
