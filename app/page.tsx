"use client"

import { useEffect } from "react"
import { Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"

import { WalletConnectButton } from "@/components/WalletConnectButton"

export default function Home() {
  const router = useRouter()
  const { connected, publicKey } = useWallet()

  useEffect(() => {
    if (connected && publicKey) {
      const walletAddress = publicKey.toString()
      localStorage.setItem("walletAddress", walletAddress)
      router.push("/inbox")
    }
  }, [connected, publicKey, router])

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FAFAFA] via-[#F5F5F5] to-[#F0F0F0] flex items-center justify-center p-6 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-[#A8E6CF]/8 via-transparent to-transparent blur-[100px] rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/[0.015]" />
      </div>

      <div className="absolute top-8 right-8">
        <button
          onClick={() => router.push("/admin")}
          className="text-[#000000]/50 hover:text-[#000000]/80 transition-all text-sm font-medium tracking-tight px-3 py-1.5 rounded-full hover:bg-white/40 backdrop-blur-sm"
        >
          Admin
        </button>
      </div>

      <div className="relative z-10 w-full max-w-[400px]">
        <div className="relative">
          {/* Radial highlight behind card for premium depth */}
          <div className="absolute inset-0 bg-gradient-radial from-white/60 via-transparent to-transparent blur-2xl scale-105 -z-10" />

          <div className="glass-card rounded-[22px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06),0_20px_48px_rgba(0,0,0,0.08)] border border-white/60 backdrop-blur-2xl bg-white/90 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05),0_12px_32px_rgba(0,0,0,0.08),0_24px_56px_rgba(0,0,0,0.10)] transition-all duration-500">
            <div className="flex justify-center mb-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-[18px] blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20%282%29-iDzx0XI9vnvq5cLKTEOLnSRsM6jYNx.png"
                  alt="Courier Logo"
                  className="w-20 h-20 rounded-[18px] shadow-[0_4px_12px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.08)] relative"
                />
              </div>
            </div>

            <div className="text-center mb-5">
              <p className="text-[13px] text-[#000000]/45 font-medium tracking-tight">Private. Fast. Encrypted.</p>
            </div>

            <div className="space-y-4">
              <div className="text-center space-y-3">
                <p className="text-[13px] text-[#000000]/60 font-medium tracking-tight">
                  Connect your Phantom wallet to continue
                </p>
              </div>

              <div className="flex flex-col items-center justify-center gap-3">
                <WalletConnectButton />
              </div>

              <div className="pt-3 border-t border-black/[0.04]">
                <div className="flex items-center justify-center gap-2 text-[11px] text-[#000000]/35 font-medium tracking-wide">
                  <Lock className="w-3 h-3 stroke-[1.5]" />
                  <span>Secure Connection via Phantom</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center items-center gap-3">
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group w-10 h-10 rounded-full bg-white/70 backdrop-blur-xl border border-white/80 flex items-center justify-center hover:bg-white hover:shadow-[0_4px_16px_rgba(168,230,207,0.15),0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          >
            <svg
              className="w-[15px] h-[15px] text-[#000000]/50 group-hover:text-[#000000]/70 transition-colors"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group w-10 h-10 rounded-full bg-white/70 backdrop-blur-xl border border-white/80 flex items-center justify-center hover:bg-white hover:shadow-[0_4px_16px_rgba(168,230,207,0.15),0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          >
            <svg
              className="w-[15px] h-[15px] text-[#000000]/50 group-hover:text-[#000000]/70 transition-colors"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"
              />
            </svg>
          </a>

          <a
            href="https://telegram.org"
            target="_blank"
            rel="noopener noreferrer"
            className="group w-10 h-10 rounded-full bg-white/70 backdrop-blur-xl border border-white/80 flex items-center justify-center hover:bg-white hover:shadow-[0_4px_16px_rgba(168,230,207,0.15),0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          >
            <svg
              className="w-[15px] h-[15px] text-[#000000]/50 group-hover:text-[#000000]/70 transition-colors"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
            </svg>
          </a>
        </div>
      </div>
    </main>
  )
}
