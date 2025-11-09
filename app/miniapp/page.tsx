"use client"

import { useEffect, useState } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import Image from "next/image"

export default function MiniAppPage() {
  const { publicKey, connected } = useWallet()
  const [linkCode, setLinkCode] = useState<string>("")
  const [isLinked, setIsLinked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (connected && publicKey) {
      checkLinkStatus()
    }
  }, [connected, publicKey])

  const checkLinkStatus = async () => {
    if (!publicKey) return

    try {
      const res = await fetch("/api/check-telegram-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: publicKey.toBase58() }),
      })

      const data = await res.json()
      setIsLinked(data.linked)
    } catch (error) {
      console.error("[v0] Failed to check link status:", error)
    }
  }

  const generateCode = async () => {
    if (!publicKey) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/generate-link-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: publicKey.toBase58() }),
      })

      const data = await res.json()

      if (data.code) {
        setLinkCode(data.code)
      } else {
        setError("Failed to generate code")
      }
    } catch (error) {
      console.error("[v0] Generate code error:", error)
      setError("Failed to generate code")
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="glass-card p-8 max-w-md w-full mx-4">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-20 w-20 bg-gray-200 rounded-2xl" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="glass-card p-8 max-w-md w-full border border-[#16CE5E]/20">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20%282%29-iDzx0XI9vnvq5cLKTEOLnSRsM6jYNx.png"
              alt="Courier"
              fill
              className="object-cover"
            />
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-center mb-2">Courier Mini App</h1>
        <p className="text-sm text-gray-600 text-center mb-8">Connect your wallet and link to Telegram</p>

        {!connected ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <WalletMultiButton className="!bg-[#16CE5E] hover:!bg-[#12b350] !rounded-xl !px-6 !py-3 !text-white !font-medium transition-all" />
            </div>
            <p className="text-xs text-center text-gray-500">
              Connect your Phantom, Solflare, or Backpack wallet to continue
            </p>
          </div>
        ) : isLinked ? (
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#16CE5E]/10 mb-2">
              <svg className="w-8 h-8 text-[#16CE5E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Already Linked!</h2>
            <p className="text-sm text-gray-600">
              Your wallet is connected to Telegram. You can use both the web app and Telegram bot.
            </p>
            <div className="pt-4">
              <button
                onClick={() => (window.location.href = "/inbox")}
                className="w-full bg-[#16CE5E] hover:bg-[#12b350] text-white rounded-xl px-6 py-3 font-medium transition-all"
              >
                Go to Inbox
              </button>
            </div>
          </div>
        ) : linkCode ? (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Link Code Generated</h2>
              <p className="text-sm text-gray-600 mb-6">Send this code to the Telegram bot to link your wallet</p>

              <div className="bg-gray-50 rounded-xl p-6 border-2 border-[#16CE5E]/20 mb-6">
                <div className="text-4xl font-mono font-bold text-[#16CE5E] tracking-wider">{linkCode}</div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 text-left space-y-2 text-sm">
                <p className="font-medium text-gray-900">How to link:</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-700">
                  <li>Open the Courier Telegram bot</li>
                  <li>
                    Send: <code className="bg-white px-2 py-0.5 rounded font-mono text-xs">/link {linkCode}</code>
                  </li>
                  <li>Your wallet will be linked!</li>
                </ol>
                <p className="text-xs text-gray-500 mt-3">Code expires in 10 minutes</p>
              </div>
            </div>

            <button
              onClick={() => {
                setLinkCode("")
                checkLinkStatus()
              }}
              className="w-full border border-gray-300 hover:border-[#16CE5E] text-gray-700 rounded-xl px-6 py-3 font-medium transition-all"
            >
              Check Link Status
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Link to Telegram</h2>
              <p className="text-sm text-gray-600">
                Connect your Telegram account to receive message notifications and use the bot
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
            )}

            <button
              onClick={generateCode}
              disabled={loading}
              className="w-full bg-[#16CE5E] hover:bg-[#12b350] text-white rounded-xl px-6 py-3 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Generating..." : "Generate Link Code"}
            </button>

            <div className="text-center">
              <button
                onClick={() => (window.location.href = "/inbox")}
                className="text-sm text-gray-600 hover:text-[#16CE5E] transition-colors"
              >
                Skip for now →
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            Connected:{" "}
            <span className="font-mono">
              {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
