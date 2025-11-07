"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export default function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#8b5cf6",
        },
        loginMethods: ["wallet"],
        walletChains: ["solana"],
        solana: { walletConnectEnabled: true },
        embeddedWallets: { enabled: false },
        siws: { enabled: true }, // ✅ critical
      }}
    >
      {children}
    </PrivyProvider>
  );
}
