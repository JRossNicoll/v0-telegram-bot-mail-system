import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { SolanaWalletProvider } from "@/components/wallet-provider"

export const metadata: Metadata = {
  title: "Courier Mail",
  description: "Wallet ↔ Telegram mail system",
  generator: "v0.app",
  icons: {
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20%282%29-iDzx0XI9vnvq5cLKTEOLnSRsM6jYNx.png",
    apple: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20%282%29-iDzx0XI9vnvq5cLKTEOLnSRsM6jYNx.png",
  },
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
