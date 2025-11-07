"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import type React from "react";

// ✅ Manual Solana chain config (Privy Solana docs)
const solanaChain = {
  id: "solana",
  name: "Solana",
  rpcUrl: "https://api.mainnet-beta.solana.com",
};

export function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cmhom9lw900d0lk0cgeufxjsj"}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#16CE5E",
          logo: "/logo.png",
          showWalletLoginFirst: true,
          walletChainType: "solana-only",
          walletList: ["phantom", "solflare", "detected_solana_wallets"],
        },

        loginMethods: ["wallet"],
        embeddedWallets: { createOnLogin: "off" },

        // ✅ Must explicitly define chain for Solana
        supportedChains: [solanaChain],
        defaultChain: solanaChain,
      }}
    >
      {children}
    </PrivyProvider>
  );
}
