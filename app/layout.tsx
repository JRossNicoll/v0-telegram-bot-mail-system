import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { SolanaWalletProvider } from "@/components/wallet-provider"

export const metadata: Metadata = {
  title: "Courier Mail",
  description: "Wallet ↔ Telegram mail system",
  generator: "v0.app",
  icons: {
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/0BEuUGcK_400x400%20%281%29-G6LT1sSkIQ4qz5WRjEGdF0FvYOYuHy.jpg",
    apple:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/0BEuUGcK_400x400%20%281%29-G6LT1sSkIQ4qz5WRjEGdF0FvYOYuHy.jpg",
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
