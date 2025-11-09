"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { Loader2, Wallet, Copy, LogOut, ChevronDown } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

const PHANTOM_DOWNLOAD_URL = "https://phantom.app/download"

export function WalletConnectButton() {
  const { connect, disconnect, connecting, connected, publicKey, wallets, select } = useWallet()
  const [phantomAvailable, setPhantomAvailable] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const hasPhantom = typeof window !== "undefined" && window.solana?.isPhantom
    setPhantomAvailable(Boolean(hasPhantom))
  }, [])

  const handleConnect = async () => {
    try {
      const phantomWallet = wallets.find((w) => w.adapter.name === "Phantom")
      if (phantomWallet) {
        select(phantomWallet.adapter.name)
        await connect()
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    }
  }

  const handleCopy = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toString())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    setShowDropdown(false)
  }

  if (connected && publicKey) {
    const address = publicKey.toString()
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`

    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 h-9 px-3 rounded-lg bg-[#16CE5E]/10 hover:bg-[#16CE5E]/20 transition-colors"
        >
          <div className="w-6 h-6 rounded-md bg-[#16CE5E]/20 flex items-center justify-center">
            <Wallet className="h-3.5 w-3.5 text-[#16CE5E]" />
          </div>
          <span className="text-sm font-semibold text-[#16CE5E] tracking-tight">{shortAddress}</span>
          <ChevronDown className="h-4 w-4 text-[#16CE5E]" />
        </button>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
            <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-black/[0.06] py-2 z-20">
              <div className="px-3 py-2 border-b border-black/[0.06]">
                <p className="text-xs text-[#000000]/50 font-medium mb-1 tracking-tight">Connected</p>
                <p className="text-sm font-mono text-[#16CE5E] font-semibold tracking-tight">{shortAddress}</p>
              </div>
              <button
                onClick={handleCopy}
                className="w-full px-3 py-2 text-left text-sm text-[#000000]/70 hover:bg-black/5 flex items-center gap-2 font-medium tracking-tight"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copied!" : "Copy address"}
              </button>
              <button
                onClick={handleDisconnect}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium tracking-tight"
              >
                <LogOut className="h-4 w-4" />
                Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={connecting || !phantomAvailable}
      className="h-9 bg-[#16CE5E] hover:bg-[#14B854] text-[#000000] font-bold text-sm rounded-lg px-4 gap-2 transition-all shadow-[0_2px_8px_rgba(22,206,94,0.25)] hover:shadow-[0_4px_12px_rgba(22,206,94,0.35)]"
    >
      {connecting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Connecting
        </>
      ) : (
        <>
          <Wallet className="h-4 w-4" />
          Connect
        </>
      )}
    </Button>
  )
}

export default WalletConnectButton
