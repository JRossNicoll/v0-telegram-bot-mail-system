"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { useMemo } from "react";

export default function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
  const solanaConnectors = useMemo(() => {
    return [new PhantomWalletAdapter()];
  }, []);

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ["wallet"],
        appearance: {
          theme: "dark",
          accentColor: "#8b5cf6",
        },
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
