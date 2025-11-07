import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import ClientOnlyPrivy from "@/components/ClientOnlyPrivy";

import {
  Geist,
  Geist_Mono,
  Source_Serif_4,
} from "next/font/google";

const geist = Geist({ subsets: ["latin"], weight: ["100","200","300","400","500","600","700","800","900"] });
const geistMono = Geist_Mono({ subsets: ["latin"], weight: ["100","200","300","400","500","600","700","800","900"] });
const sourceSerif4 = Source_Serif_4({ subsets: ["latin"], weight: ["200","300","400","500","600","700","800","900"] });

export const metadata: Metadata = {
  title: "Courier - Private. Fast. Encrypted.",
  description: "Send on-chain and off-chain messages to Solana wallets via Telegram",
  icons: {
    icon: "/favicon.ico",
  },
    generator: 'v0.app'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <ClientOnlyPrivy>
          {children}
        </ClientOnlyPrivy>

        <Analytics />
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
