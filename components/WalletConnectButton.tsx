"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, PlugZap, Wallet } from "lucide-react"
import { useLoginWithSiws, usePrivy } from "@privy-io/react-auth"
import bs58 from "bs58"

const PHANTOM_DOWNLOAD_URL = "https://phantom.app/download"
const textEncoder = new TextEncoder()

type PhantomProvider = NonNullable<Window["solana"]>

type PhantomConnectResult = Awaited<ReturnType<PhantomProvider["connect"]>>

type PhantomSignature =
  | string
  | Uint8Array
  | { signature: Uint8Array }

function getPhantomProvider(): PhantomProvider | undefined {
  if (typeof window === "undefined") return undefined

  const candidate = window.solana
  if (candidate?.isPhantom) {
    return candidate
  }

  const providers = candidate?.providers
  if (providers?.length) {
    return providers.find((provider) => provider?.isPhantom)
  }

  const phantom = window.phantom?.solana
  if (phantom?.isPhantom) {
    return phantom
  }

  return undefined
}

function deriveAddress(connection: PhantomConnectResult, provider: PhantomProvider) {
  const publicKey = connection?.publicKey ?? provider.publicKey

  if (!publicKey) {
    return undefined
  }

  return typeof publicKey === "string" ? publicKey : publicKey.toBase58()
}

function encodeSignature(signature: PhantomSignature) {
  if (typeof signature === "string") {
    return signature
  }

  if (signature instanceof Uint8Array) {
    return bs58.encode(signature)
  }

  return bs58.encode(signature.signature)
}

export function WalletConnectButton() {
  const { ready, authenticated } = usePrivy()
  const { generateSiwsMessage, loginWithSiws } = useLoginWithSiws()
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phantomAvailable, setPhantomAvailable] = useState(true)

  useEffect(() => {
    setPhantomAvailable(Boolean(getPhantomProvider()))
  }, [])

  useEffect(() => {
    if (authenticated) {
      setIsConnecting(false)
    }
  }, [authenticated])

  const handleConnect = useCallback(async () => {
    if (!ready) {
      setError("Privy is still initializing. Please try again in a moment.")
      return
    }

    const provider = getPhantomProvider()

    if (!provider) {
      setPhantomAvailable(false)
      setError("Phantom wallet is not installed.")
      if (typeof window !== "undefined") {
        window.open(PHANTOM_DOWNLOAD_URL, "_blank", "noopener,noreferrer")
      }
      return
    }

    try {
      setError(null)
      setIsConnecting(true)

      const connection = await provider.connect({ onlyIfTrusted: false })
      const address = deriveAddress(connection, provider)

      if (!address) {
        throw new Error("Unable to read Phantom wallet address")
      }

      const message = await generateSiwsMessage({ address })
      const encodedMessage = textEncoder.encode(message)
      const signed = (await provider.signMessage(encodedMessage, "utf8")) as PhantomSignature
      const signature = encodeSignature(signed)

      await loginWithSiws({
        message,
        signature,
        walletClientType: "phantom",
        connectorType: "injected",
      })
    } catch (connectError) {
      console.error("[Privy] Wallet login failed:", connectError)
      const code = (connectError as { code?: number }).code

      if (code === 4001) {
        setError("Signature request was rejected in Phantom.")
      } else {
        const fallback = (connectError as Error)?.message ?? "Unable to authenticate with Privy."
        setError(fallback)
      }

      setIsConnecting(false)
    }
  }, [generateSiwsMessage, loginWithSiws, ready])

  const buttonLabel = useMemo(() => {
    if (!ready) {
      return (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Initializing...
        </>
      )
    }

    if (isConnecting) {
      return (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Connecting...
        </>
      )
    }

    return (
      <>
        <Wallet className="h-5 w-5" />
        Connect Phantom
      </>
    )
  }, [isConnecting, ready])

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleConnect}
        disabled={!ready || isConnecting}
        className="w-full h-[52px] bg-[#16CE5E] hover:bg-[#14B854] text-[#000000] font-bold text-[15px] rounded-[14px] shadow-[0_8px_24px_rgba(22,206,94,0.35),0_4px_12px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_32px_rgba(22,206,94,0.45),0_6px_16px_rgba(0,0,0,0.16)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:translate-y-[-1px]"
      >
        {buttonLabel}
      </button>

      {!phantomAvailable && (
        <a
          href={PHANTOM_DOWNLOAD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#16CE5E] hover:text-[#14B854]"
        >
          <PlugZap className="h-4 w-4" />
          Install Phantom Wallet
        </a>
      )}

      {error && <p className="text-xs text-red-500 text-center leading-tight">{error}</p>}
    </div>
  )
}
