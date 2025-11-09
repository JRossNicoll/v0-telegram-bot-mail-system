import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { PrivyProvider } from "@/components/privy-provider"

export const metadata: Metadata = {
  title: "Courier Mail",
  description: "Wallet ↔ Telegram mail system",
  generator: "v0.app",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PrivyProvider>{children}</PrivyProvider>
      </body>
    </html>
  )
}
