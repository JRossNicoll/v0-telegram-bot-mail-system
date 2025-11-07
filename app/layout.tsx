import "./globals.css";
import PrivyProviderWrapper from "./privy-provider";

export const metadata = {
  title: "Courier",
  description: "Secure Telegram mail inbox",
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
