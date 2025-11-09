"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { Wallet } from "lucide-react"

export function WalletConnectButton() {
  const { connected, publicKey } = useWallet()

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <WalletMultiButton className="w-full h-[52px] !bg-[#16CE5E] hover:!bg-[#14B854] !text-[#000000] !font-bold !text-[15px] !rounded-[14px] !shadow-[0_8px_24px_rgba(22,206,94,0.35),0_4px_12px_rgba(0,0,0,0.12)] hover:!shadow-[0_12px_32px_rgba(22,206,94,0.45),0_6px_16px_rgba(0,0,0,0.16)] !transition-all flex items-center justify-center gap-2 hover:!translate-y-[-1px]">
        {!connected && (
          <>
            <Wallet className="h-5 w-5" />
            Connect Phantom
          </>
        )}
      </WalletMultiButton>

      {connected && publicKey && (
        <p className="text-xs text-green-600 font-medium">
          Connected: {publicKey.toString().slice(0, 6)}...{publicKey.toString().slice(-4)}
        </p>
      )}
    </div>
  )
}

export default WalletConnectButton
