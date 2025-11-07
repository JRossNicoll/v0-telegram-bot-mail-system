"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { solanaWallet } from "@privy-io/react-auth/solana";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";

export default function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#676FFF",
        },
        walletConnectCloudProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
        externalWallets: {
          solana: {
            connectors: [
              solanaWallet({
                wallet: new PhantomWalletAdapter(),
              }),
            ],
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
