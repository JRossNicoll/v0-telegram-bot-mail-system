import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { SolanaWalletProvider } from "@/components/wallet-provider"

export const metadata: Metadata = {
  title: "Courier Mail",
  description: "Wallet ↔ Telegram mail system",
  generator: "v0.app",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SolanaWalletProvider>{children}</SolanaWalletProvider>
      </body>
    </html>
  )
}
