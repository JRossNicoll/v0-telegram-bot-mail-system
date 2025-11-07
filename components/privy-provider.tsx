"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import type React from "react";

export function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
  // Safely initialize Solana connectors only on client side
  const solanaConnectors =
    typeof window !== "undefined"
      ? toSolanaWalletConnectors({ shouldAutoConnect: true })
      : [];

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cmhom9lw900d0lk0cgeufxjsj"}
      config={{
        loginMethods: ["wallet"],
        appearance: {
          theme: "light",
          accentColor: "#16CE5E",
          logo: "/logo.png",
          showWalletLoginFirst: true,
          walletChainType: "solana-only",
          walletList: ["phantom", "solflare", "detected_solana_wallets"],
        },
        embeddedWallets: {
          createOnLogin: "off",
        },
        legal: {
          termsAndConditionsUrl: undefined,
          privacyPolicyUrl: undefined,
        },
        allowedChains: ["solana"],
        defaultChain: "solana",
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
