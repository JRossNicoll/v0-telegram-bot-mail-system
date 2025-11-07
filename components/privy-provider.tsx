"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import type React from "react";
import { solana } from "@privy-io/react-auth/chains"; // ✅ required

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
        embeddedWallets: {
          createOnLogin: "off",
        },

        // ✅ REQUIRED FOR SOLANA
        supportedChains: [solana],
        defaultChain: solana,

        legal: {
          termsAndConditionsUrl: undefined,
          privacyPolicyUrl: undefined,
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
