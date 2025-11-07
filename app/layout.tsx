import type { Metadata } from "next";
import type React from "react";

import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Script from "next/script";

// ✅ Client wrapper to run Privy on the client only
import ClientPrivyWrapper from "@/components/ClientPrivyWrapper";

export const metadata: Metadata = {
  title: "Courier - Private. Fast. Encrypted.",
  description: "Send on-chain and off-chain messages to Solana wallets via Telegram",
  generator: "v0.app",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {/* ✅ Privy must wrap the app on the client only */}
        <ClientPrivyWrapper>
          {children}
        </ClientPrivyWrapper>

        {/* ✅ Analytics */}
        <Analytics />

        {/* ✅ Telegram Mini App SDK */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
