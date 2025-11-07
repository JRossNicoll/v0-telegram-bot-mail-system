import "./globals.css";
import PrivyProviderWrapper from "./privy-provider";

export const metadata = {
  title: "Courier",
  description: "Decentralized Solana messaging",
    generator: 'v0.app'
};

export default function RootLayout({ children }) {
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
