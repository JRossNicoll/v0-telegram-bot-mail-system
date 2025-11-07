"use client"

import dynamic from "next/dynamic"
import type { ReactNode } from "react"

const PrivyProviderWrapper = dynamic(() => import("@/app/privy-provider"), {
  ssr: false,
})

export default function ClientOnlyPrivy({ children }: { children: ReactNode }) {
  return <PrivyProviderWrapper>{children}</PrivyProviderWrapper>
}
