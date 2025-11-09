import type React from "react"
import { WalletProvider } from "@/components/wallet-provider"

export default function MiniAppLayout({ children }: { children: React.ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>
}
