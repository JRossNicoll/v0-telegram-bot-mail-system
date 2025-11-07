"use client";

import { PrivyProviderWrapper } from "./privy-provider";

export default function ClientPrivyWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PrivyProviderWrapper>{children}</PrivyProviderWrapper>;
}
