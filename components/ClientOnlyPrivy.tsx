"use client";

import dynamic from "next/dynamic";

const PrivyProviderWrapper = dynamic(
  () => import("./privy-provider").then(m => m.PrivyProviderWrapper),
  { ssr: false }
);

export default function ClientOnlyPrivy({ children }: { children: React.ReactNode }) {
  return <PrivyProviderWrapper>{children}</PrivyProviderWrapper>;
}
