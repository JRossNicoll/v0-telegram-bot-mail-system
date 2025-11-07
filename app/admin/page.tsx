"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Copy, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<string>("Checking bot status...")
  const [loading, setLoading] = useState(true)
  const [webhookUrl, setWebhookUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const [settingWebhook, setSettingWebhook] = useState(false)
  const router = useRouter()

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123"

  useEffect(() => {
    if (authenticated) {
      checkBot()
      if (typeof window !== "undefined") {
        setWebhookUrl(`${window.location.origin}/api/webhook`)
      }
    }
  }, [authenticated])

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true)
      localStorage.setItem("adminAuth", "true")
    } else {
      alert("Invalid password")
    }
  }

  useEffect(() => {
    if (localStorage.getItem("adminAuth") === "true") {
      setAuthenticated(true)
    }
  }, [])

  const checkBot = async () => {
    try {
      const response = await fetch("/api/bot")
      const data = await response.json()
      setStatus(data.status)
    } catch (error) {
      setStatus("Error checking bot")
      console.error("[v0] Bot check error:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const setWebhook = async () => {
    setSettingWebhook(true)
    try {
      const BOT_TOKEN = "8200042995:AAGrZRpMwlUKrHC_aYEgDjluYFdMFWkquWo"
      const response = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`,
      )

      const data = await response.json()

      if (data.ok) {
        setStatus("Webhook set successfully! Bot is now active.")
      } else {
        setStatus(`Failed to set webhook: ${data.description}`)
      }
    } catch (error) {
      setStatus("Error setting webhook")
      console.error("[v0] Webhook setup error:", error)
    } finally {
      setSettingWebhook(false)
    }
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#16CE5E] opacity-[0.03] blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10 w-full max-w-[420px]">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-black/[0.06]">
            <div className="flex justify-center mb-4 relative">
              <div className="absolute inset-0 bg-[#16CE5E] opacity-5 blur-2xl rounded-full" />
              <Image src="/logo.png" alt="COURIER" width={64} height={64} className="relative z-10 rounded-2xl" />
            </div>

            <div className="text-center mb-8 space-y-1">
              <h1 className="text-3xl font-black text-[#000000] tracking-tight leading-tight">Admin</h1>
              <p className="text-sm text-[#000000]/50 font-medium tracking-tight">Enter password to continue</p>
            </div>

            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogin()
                }}
                className="h-12 bg-[#F5F5F5] border-0 rounded-xl px-4 text-[#000000] placeholder:text-[#000000]/40 focus-visible:ring-1 focus-visible:ring-[#16CE5E] focus-visible:ring-offset-0 font-normal text-[15px] transition-all"
              />

              <Button
                onClick={handleLogin}
                className="w-full h-12 bg-[#16CE5E] hover:bg-[#14B854] text-[#000000] font-bold rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all text-[15px] tracking-tight"
              >
                Login
              </Button>

              <Button
                onClick={() => router.push("/")}
                variant="ghost"
                className="w-full h-10 text-[#000000]/50 hover:text-[#000000] hover:bg-transparent font-medium text-sm tracking-tight"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-black text-[#000000] tracking-tight">Admin Dashboard</h1>
          <Button
            variant="outline"
            onClick={() => {
              localStorage.removeItem("adminAuth")
              setAuthenticated(false)
            }}
            className="border-black/[0.06] hover:bg-black/5 text-[#000000] font-medium"
          >
            Logout
          </Button>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-black/[0.06]">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4 text-[#000000] tracking-tight">Bot Status</h2>
              <div className="flex items-center gap-2 p-4 bg-[#F5F5F5] rounded-xl">
                {loading && <Loader2 className="h-5 w-5 animate-spin text-[#16CE5E]" />}
                <p className="font-medium text-[#000000] tracking-tight">{status}</p>
              </div>
            </div>

            {!loading && (
              <div className="space-y-4 pt-4 border-t border-black/[0.06]">
                <h3 className="font-bold text-[#000000] tracking-tight">Webhook Configuration</h3>
                <div className="flex gap-2">
                  <Input
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://your-domain.com/api/webhook"
                    className="font-mono text-sm bg-[#F5F5F5] border-0 rounded-xl"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyWebhookUrl}
                    className="border-black/[0.06] hover:bg-black/5 rounded-xl bg-transparent"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <Button
                  onClick={setWebhook}
                  disabled={settingWebhook || !webhookUrl}
                  className="w-full bg-[#16CE5E] hover:bg-[#14B854] text-[#000000] font-bold rounded-xl h-12"
                >
                  {settingWebhook ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Setting Webhook...
                    </>
                  ) : (
                    "Set Webhook"
                  )}
                </Button>
                <p className="text-sm text-[#000000]/50 tracking-tight">
                  Configure the webhook URL to activate the Telegram bot.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-black/[0.06]">
          <h2 className="text-xl font-bold mb-4 text-[#000000] tracking-tight">Bot Commands</h2>
          <div className="space-y-2 text-sm">
            <div className="flex gap-3 p-3 bg-[#F5F5F5] rounded-xl">
              <code className="bg-white px-2 py-1 rounded-lg text-[#16CE5E] font-mono font-medium">/start</code>
              <span className="text-[#000000]/70 tracking-tight">Initialize the bot</span>
            </div>
            <div className="flex gap-3 p-3 bg-[#F5F5F5] rounded-xl">
              <code className="bg-white px-2 py-1 rounded-lg text-[#16CE5E] font-mono font-medium">/connect</code>
              <span className="text-[#000000]/70 tracking-tight">Connect Solana wallet</span>
            </div>
            <div className="flex gap-3 p-3 bg-[#F5F5F5] rounded-xl">
              <code className="bg-white px-2 py-1 rounded-lg text-[#16CE5E] font-mono font-medium">/send</code>
              <span className="text-[#000000]/70 tracking-tight">Send off-chain message</span>
            </div>
            <div className="flex gap-3 p-3 bg-[#F5F5F5] rounded-xl">
              <code className="bg-white px-2 py-1 rounded-lg text-[#16CE5E] font-mono font-medium">/sendchain</code>
              <span className="text-[#000000]/70 tracking-tight">Send on-chain message</span>
            </div>
            <div className="flex gap-3 p-3 bg-[#F5F5F5] rounded-xl">
              <code className="bg-white px-2 py-1 rounded-lg text-[#16CE5E] font-mono font-medium">/inbox</code>
              <span className="text-[#000000]/70 tracking-tight">View received messages</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
