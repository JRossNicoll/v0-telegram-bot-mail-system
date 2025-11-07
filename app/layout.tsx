import "./globals.css";
import type { Metadata } from "next";
import PrivyProviderWrapper from "./privy-provider";

export const metadata: Metadata = {
  title: "Courier",
  description: "Smart Telegram Web App + Solana + Privy",
    generator: 'v0.app'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PrivyProviderWrapper>
          {children}
        </PrivyProviderWrapper>
      </body>
    </html>
  );
}
