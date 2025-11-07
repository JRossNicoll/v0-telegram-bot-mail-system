"use client"

import PrivyProviderWrapper from "@/app/privy-provider"
import type { ReactNode } from "react"

export default function ClientPrivyWrapper({ children }: { children: ReactNode }) {
  return <PrivyProviderWrapper>{children}</PrivyProviderWrapper>
}
