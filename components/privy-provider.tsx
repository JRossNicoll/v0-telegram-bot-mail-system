"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { useEffect, useState } from "react";

export default function PrivyProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [phantomProvider, setPhantomProvider] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).phantom?.solana) {
      setPhantomProvider((window as any).phantom.solana);
      console.log("✅ Phantom provider injected");
    } else {
      console.log("❌ Phantom not detected");
    }
  }, []);

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ["wallet"],
        appearance: {
          theme: "dark",
          accentColor: "#6C47FF",
        },
        walletConnectors: {
          injected: true,
          solana: phantomProvider
            ? [
                {
                  name: "phantom",
                  provider: phantomProvider,
                },
              ]
            : [],
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
