"use client"

import { usePrivy } from "@privy-io/react-auth"
import { Button } from "@/components/ui/button"
import { Wallet, LogOut } from "lucide-react"

export function WalletButton() {
  const { ready, authenticated, login, logout, user } = usePrivy()

  if (!ready) {
    return null
  }

  if (!authenticated) {
    return (
      <Button
        onClick={login}
        size="sm"
        className="bg-[#16CE5E] hover:bg-[#14B854] text-[#000000] font-bold h-9 px-4 rounded-lg"
      >
        <Wallet className="h-4 w-4 mr-2" />
        Connect
      </Button>
    )
  }

  const solanaWallet = user?.linkedAccounts.find(
    (account) => account.type === "wallet" && account.chainType === "solana",
  )
  const walletAddress = solanaWallet && "address" in solanaWallet ? solanaWallet.address : ""

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#16CE5E]/10 rounded-lg">
        <div className="w-2 h-2 bg-[#16CE5E] rounded-full" />
        <span className="text-xs font-mono text-[#000000] font-semibold">{formatAddress(walletAddress)}</span>
      </div>
      <Button
        onClick={logout}
        variant="ghost"
        size="sm"
        className="text-[#000000]/60 hover:text-[#000000] hover:bg-black/5 h-9 px-3 rounded-lg"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )
}
