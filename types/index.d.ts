// Custom global type declarations for the Courier app.
// Add ambient module definitions here when needed.

declare global {
  interface PhantomPublicKey {
    toBase58(): string
  }

  interface PhantomProvider {
    isPhantom?: boolean
    publicKey?: PhantomPublicKey
    providers?: PhantomProvider[]
    connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey?: PhantomPublicKey }>
    disconnect?: () => Promise<void>
    signMessage(message: Uint8Array, display?: string): Promise<Uint8Array | { signature: Uint8Array } | string>
    request?<T = unknown>(args: { method: string; params?: unknown[] }): Promise<T>
    on?(event: string, handler: (...args: unknown[]) => void): void
    off?(event: string, handler: (...args: unknown[]) => void): void
  }

  interface Window {
    solana?: PhantomProvider & { providers?: PhantomProvider[] }
    phantom?: {
      solana?: PhantomProvider
    }
  }
}

export {}
