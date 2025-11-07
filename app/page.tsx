"use client"

import { useEffect, useState } from "react"
import { Loader2, Lock, Wallet } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { usePrivy } from "@privy-io/react-auth"

export default function Home() {
  const router = useRouter()
  const { ready, authenticated, user, login } = usePrivy()
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    console.log("[v0] Privy ready:", ready, "authenticated:", authenticated)
    if (ready && authenticated && user) {
      const solanaWallet = user.linkedAccounts.find(
        (account) => account.type === "wallet" && account.chainType === "solana",
      )

      if (solanaWallet && "address" in solanaWallet) {
        const walletAddress = solanaWallet.address
        console.log("[v0] Already authenticated with wallet:", walletAddress)
        localStorage.setItem("walletAddress", walletAddress)
        router.push("/inbox")
      }
    }
  }, [ready, authenticated, user, router])

  const handleLogin = async () => {
    if (isConnecting) {
      console.log("[v0] Already connecting, ignoring duplicate click")
      return
    }

    console.log("[v0] Connect Wallet button clicked")
    setIsConnecting(true)

    try {
      await login()
    } catch (error: any) {
      console.error("[v0] Login error:", error)

      if (error?.details?.eipCode === -32002 || error?.code === -32002) {
        console.log("[v0] Phantom busy, retrying in 1 second...")
        setTimeout(async () => {
          try {
            await login()
          } catch (retryError) {
            console.error("[v0] Retry failed:", retryError)
            setIsConnecting(false)
          }
        }, 1000)
      } else {
        setIsConnecting(false)
      }
    }
  }

  useEffect(() => {
    if (authenticated) {
      setIsConnecting(false)
    }
  }, [authenticated])

  return (
    <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#16CE5E] opacity-[0.03] blur-[120px] rounded-full" />
      </div>

      <div className="absolute top-8 right-8">
        <button
          onClick={() => router.push("/admin")}
          className="text-[#000000]/60 hover:text-[#000000] transition-colors text-sm font-medium tracking-tight"
        >
          Admin
        </button>
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 shadow-[0_20px_60px_rgba(0,0,0,0.12),0_8px_20px_rgba(0,0,0,0.08),0_3px_8px_rgba(0,0,0,0.04)] border border-black/[0.06]">
          <div className="flex justify-center mb-4 relative">
            <div className="absolute inset-0 bg-[#16CE5E] opacity-5 blur-2xl rounded-full" />
            <Image src="/logo.png" alt="COURIER" width={64} height={64} className="relative z-10 rounded-2xl" />
          </div>

          <div className="text-center mb-8 space-y-1">
            <h1 className="text-3xl font-black text-[#000000] tracking-tight leading-tight">Courier</h1>
            <p className="text-sm text-[#000000]/50 font-medium tracking-tight">Private. Fast. Encrypted.</p>
          </div>

          <div className="space-y-6">
            <div className="text-center space-y-3">
              <p className="text-sm text-[#000000]/70 font-semibold tracking-tight">
                Connect your Phantom wallet to continue
              </p>
            </div>

            <div className="flex flex-col items-center justify-center gap-4">
              {!ready ? (
                <div className="flex items-center gap-2 text-sm text-[#16CE5E] font-semibold">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  disabled={!ready || isConnecting}
                  className="w-full h-[52px] bg-[#16CE5E] hover:bg-[#14B854] text-[#000000] font-bold text-[15px] rounded-[14px] shadow-[0_8px_24px_rgba(22,206,94,0.35),0_4px_12px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_32px_rgba(22,206,94,0.45),0_6px_16px_rgba(0,0,0,0.16)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:translate-y-[-1px]"
                >
                  {isConnecting ? (
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
              )}
            </div>

            <div className="pt-4 border-t border-black/[0.06]">
              <div className="flex items-center justify-center gap-2 text-xs text-[#000000]/40 font-medium">
                <Lock className="w-3.5 h-3.5" />
                <span>Secure connection via Privy</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center items-center gap-4">
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-white/60 backdrop-blur border border-black/[0.06] flex items-center justify-center hover:bg-white transition-all shadow-sm"
          >
            <svg className="w-4 h-4 text-[#000000]/60" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-white/60 backdrop-blur border border-black/[0.06] flex items-center justify-center hover:bg-white transition-all shadow-sm"
          >
            <svg className="w-4 h-4 text-[#000000]/60" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"
                clipRule="evenodd"
              />
            </svg>
          </a>

          <a
            href="https://telegram.org"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-white/60 backdrop-blur border border-black/[0.06] flex items-center justify-center hover:bg-white transition-all shadow-sm"
          >
            <svg className="w-4 h-4 text-[#000000]/60" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
            </svg>
          </a>
        </div>
      </div>
    </main>
  )
}
