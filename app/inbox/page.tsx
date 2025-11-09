"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Loader2,
  Mail,
  Bell,
  BellOff,
  ExternalLink,
  Send,
  LogOut,
  RefreshCw,
  ChevronDown,
  Lock,
  X,
  Edit3,
  Package,
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useWallet } from "@solana/wallet-adapter-react"

interface Message {
  from: string
  to: string
  message: string
  timestamp: number
  onChain: boolean
  txSignature?: string
  read?: boolean
  id?: string
}

export default function InboxPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [sendType, setSendType] = useState<"onchain" | "offchain" | null>(null)
  const [recipient, setRecipient] = useState("")
  const [messageContent, setMessageContent] = useState("")
  const [sending, setSending] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [walletSource, setWalletSource] = useState<"external" | "custodial">("custodial")
  const { connected, publicKey } = useWallet()
  const [isTelegramMiniApp, setIsTelegramMiniApp] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const isTelegram = typeof window !== "undefined" && !!(window as any).Telegram?.WebApp?.initData
    setIsTelegramMiniApp(isTelegram)

    if (connected && publicKey) {
      const connectedAddress = publicKey.toString()
      console.log("[v0] Solana wallet authenticated:", connectedAddress)
      setWalletAddress(connectedAddress)
      setIsAuthenticated(true)
      setWalletSource("external")
      localStorage.setItem("walletAddress", connectedAddress)
      localStorage.setItem("walletSource", "external")
      loadMessages(connectedAddress)
      return
    }

    // Fallback to localStorage
    const savedWallet = localStorage.getItem("walletAddress")
    const savedSource = localStorage.getItem("walletSource")
    const notifStatus = localStorage.getItem("notifications") === "enabled"

    if (savedWallet) {
      setWalletAddress(savedWallet)
      setIsAuthenticated(true)
      setNotificationsEnabled(notifStatus)
      setWalletSource(savedSource === "external" ? "external" : "custodial")
      loadMessages(savedWallet)
    } else if (!connected) {
      router.push("/")
    }

    if (notifStatus && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission()
      }
    }

    const interval = setInterval(() => {
      if (savedWallet) {
        loadMessages(savedWallet)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [router, connected, publicKey, mounted])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-[#FAFBFC] to-[#F5F7F9] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#16CE5E]/20 border-t-[#16CE5E] rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const loadMessages = async (address: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/messages?wallet=${address}`)
      const data = await response.json()

      const welcomeMessage: Message = {
        from: "Courier Team",
        to: address,
        message:
          "Welcome to Courier! Your messages are encrypted end-to-end. You can send on-chain messages that are permanently stored on Solana, or off-chain messages for instant delivery. Get started by connecting your wallet in Telegram.",
        timestamp: Date.now() - 3600000,
        onChain: false,
        read: localStorage.getItem(`msg-read-welcome-${address}`) === "true",
        id: `welcome-${address}`,
      }

      let allMessages: Message[] = []
      if (data.messages && data.messages.length > 0) {
        allMessages = data.messages
      } else {
        allMessages = [welcomeMessage]
      }

      setMessages(allMessages)

      // Calculate unread count from loaded messages
      const unread = allMessages.filter((m) => !m.read).length
      setUnreadCount(unread)
    } catch (error) {
      console.error("[v0] Error loading messages:", error)
      const welcomeMessage: Message = {
        from: "Courier Team",
        to: address,
        message:
          "Welcome to Courier! Your messages are encrypted end-to-end. You can send on-chain messages that are permanently stored on Solana, or off-chain messages for instant delivery. Get started by connecting your wallet in Telegram.",
        timestamp: Date.now() - 3600000,
        onChain: false,
        read: localStorage.getItem(`msg-read-welcome-${address}`) === "true",
        id: `welcome-${address}`,
      }
      setMessages([welcomeMessage])
      setUnreadCount(welcomeMessage.read ? 0 : 1)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      // Update UI immediately
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.id === messageId) {
            // Store read status for welcome message in localStorage
            if (messageId.startsWith("welcome-")) {
              localStorage.setItem(`msg-read-${messageId}`, "true")
            }
            return { ...msg, read: true }
          }
          return msg
        }),
      )

      // Recalculate unread count
      setUnreadCount((prev) => Math.max(0, prev - 1))

      // Persist to server for non-welcome messages
      if (!messageId.startsWith("welcome-")) {
        await fetch("/api/messages/mark-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: walletAddress, messageId }),
        })
      }
    } catch (error) {
      console.error("[v0] Error marking message as read:", error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("walletAddress")
    localStorage.removeItem("notifications")
    localStorage.removeItem("walletSource")
    setWalletSource("custodial")
    router.push("/")
  }

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      if ("Notification" in window) {
        const permission = await Notification.requestPermission()
        if (permission === "granted") {
          setNotificationsEnabled(true)
          localStorage.setItem("notifications", "enabled")
          new Notification("COURIER", {
            body: "Notifications enabled! You'll be notified of new messages.",
          })
        } else {
          alert("Please enable notifications in your browser settings")
        }
      } else {
        alert("Your browser doesn't support notifications")
      }
    } else {
      setNotificationsEnabled(false)
      localStorage.setItem("notifications", "disabled")
    }
  }

  const handleSendMessage = async () => {
    if (!recipient || !messageContent || !sendType) {
      alert("Please fill in all fields")
      return
    }

    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(recipient)) {
      alert("Invalid recipient wallet address")
      return
    }

    setSending(true)

    try {
      if (sendType === "onchain") {
        if (typeof window === "undefined" || !(window as any).solana?.isPhantom) {
          alert("Please install Phantom wallet to send on-chain messages")
          setSending(false)
          return
        }

        const provider = (window as any).solana

        if (!provider.isConnected) {
          await provider.connect()
        }

        const response = await fetch("/api/send-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from: walletAddress,
            to: recipient,
            message: messageContent,
            onChain: true,
          }),
        })

        const data = await response.json()

        if (data.success) {
          alert(`Message sent on-chain! Transaction: ${data.signature}`)
          setShowSendModal(false)
          setSendType(null)
          setRecipient("")
          setMessageContent("")
          loadMessages(walletAddress)
        } else {
          alert(`Failed to send: ${data.error}`)
        }
      } else {
        const response = await fetch("/api/send-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from: walletAddress,
            to: recipient,
            message: messageContent,
            onChain: false,
          }),
        })

        const data = await response.json()

        if (data.success) {
          alert("Message sent off-chain!")
          setShowSendModal(false)
          setSendType(null)
          setRecipient("")
          setMessageContent("")
          loadMessages(walletAddress)
        } else {
          alert(`Failed to send: ${data.error}`)
        }
      }
    } catch (error: any) {
      console.error("[v0] Send error:", error)
      alert(`Error: ${error.message}`)
    } finally {
      setSending(false)
    }
  }

  const formatAddress = (address: string) => {
    if (address === "Courier Team") return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const onChainMessages = messages.filter((m) => m.onChain)
  const offChainMessages = messages.filter((m) => !m.onChain)
  const unreadMessages = messages.filter((m) => !m.read)
  const unreadOnChain = onChainMessages.filter((m) => !m.read).length
  const unreadOffChain = offChainMessages.filter((m) => !m.read).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-[#FAFBFC] to-[#F5F7F9] flex">
      <aside className="md:hidden fixed left-0 top-0 bottom-0 w-20 glass-panel flex flex-col items-center py-8 space-y-8 z-30 border-r border-white/40">
        <Link href="/" className="relative group">
          <div className="absolute inset-0 bg-[#16CE5E] opacity-0 group-hover:opacity-20 blur-2xl transition-all duration-500 rounded-2xl" />
          <div className="relative z-10 w-12 h-12 rounded-[18px] glass-card flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <Package className="w-7 h-7 text-[#16CE5E]" />
          </div>
        </Link>

        <nav className="flex-1 flex flex-col space-y-5">
          <button className="relative w-12 h-12 rounded-[18px] glass-card flex items-center justify-center text-[#16CE5E] mint-glow">
            <Mail className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => loadMessages(walletAddress)}
            className="relative w-12 h-12 rounded-[18px] bg-white/40 backdrop-blur-xl flex items-center justify-center text-gray-600 hover:bg-white/70 hover:text-gray-900 transition-all duration-300 hover:scale-105"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <button
            onClick={toggleNotifications}
            className="relative w-12 h-12 rounded-[18px] bg-white/40 backdrop-blur-xl flex items-center justify-center text-gray-600 hover:bg-white/70 hover:text-gray-900 transition-all duration-300 hover:scale-105"
          >
            {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setShowSendModal(true)}
            className="relative w-12 h-12 rounded-[18px] bg-white/40 backdrop-blur-xl flex items-center justify-center text-gray-600 hover:bg-white/70 hover:text-gray-900 transition-all duration-300 hover:scale-105"
          >
            <Send className="w-5 h-5" />
          </button>
        </nav>

        <button
          onClick={handleLogout}
          className="w-12 h-12 rounded-[18px] hover:bg-white/40 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all duration-300"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </aside>

      <aside className="hidden md:flex w-28 glass-panel border-r border-white/40 flex-col items-center py-10 space-y-10">
        <Link href="/" className="relative group">
          <div className="absolute inset-0 bg-[#16CE5E] opacity-0 group-hover:opacity-20 blur-2xl transition-all duration-500 rounded-2xl" />
          <div className="relative z-10 w-14 h-14 rounded-[20px] glass-card flex items-center justify-center group-hover:scale-105 transition-all duration-300">
            <Package className="w-8 h-8 text-[#16CE5E]" />
          </div>
        </Link>

        <nav className="flex-1 flex flex-col space-y-6">
          <button className="relative w-14 h-14 rounded-[20px] glass-card flex items-center justify-center text-[#16CE5E] mint-glow hover:scale-105 transition-all duration-300 group">
            <Mail className="w-6 h-6" />
            <span className="absolute left-20 glass-card text-gray-900 text-sm font-semibold px-4 py-2 rounded-[14px] opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-lg">
              Inbox
            </span>
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-br from-red-500 to-red-600 text-white text-[11px] font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => loadMessages(walletAddress)}
            className="relative w-14 h-14 rounded-[20px] bg-white/40 backdrop-blur-xl flex items-center justify-center text-gray-600 hover:bg-white/70 hover:text-gray-900 transition-all duration-300 hover:scale-105 group"
          >
            <RefreshCw className="w-6 h-6" />
            <span className="absolute left-20 glass-card text-gray-900 text-sm font-semibold px-4 py-2 rounded-[14px] opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-lg">
              Refresh
            </span>
          </button>

          <button
            onClick={toggleNotifications}
            className="relative w-14 h-14 rounded-[20px] bg-white/40 backdrop-blur-xl flex items-center justify-center text-gray-600 hover:bg-white/70 hover:text-gray-900 transition-all duration-300 hover:scale-105 group"
          >
            {notificationsEnabled ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
            <span className="absolute left-20 glass-card text-gray-900 text-sm font-semibold px-4 py-2 rounded-[14px] opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-lg">
              {notificationsEnabled ? "Notifications On" : "Notifications Off"}
            </span>
          </button>

          <button
            onClick={() => setShowSendModal(true)}
            className="relative w-14 h-14 rounded-[20px] bg-white/40 backdrop-blur-xl flex items-center justify-center text-gray-600 hover:bg-white/70 hover:text-gray-900 transition-all duration-300 hover:scale-105 group"
          >
            <Send className="w-6 h-6" />
            <span className="absolute left-20 glass-card text-gray-900 text-sm font-semibold px-4 py-2 rounded-[14px] opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-lg">
              Send Message
            </span>
          </button>
        </nav>

        <button
          onClick={handleLogout}
          className="w-14 h-14 rounded-[20px] hover:bg-white/40 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all duration-300 hover:scale-105 group relative"
        >
          <LogOut className="w-6 h-6" />
          <span className="absolute left-20 glass-card text-gray-900 text-sm font-semibold px-4 py-2 rounded-[14px] opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-lg">
            Logout
          </span>
        </button>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col ml-20 md:ml-0">
        <header className="glass-panel border-b border-white/40 float-shadow">
          <div className="px-6 md:px-10 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Courier</h1>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full glass-card">
                <Lock className="w-3.5 h-3.5 text-[#16CE5E]" />
                <span className="text-xs font-semibold text-[#16CE5E] tracking-tight">Encrypted</span>
              </div>
              {unreadCount > 0 && (
                <Badge className="bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-500 hover:to-red-600 h-6 px-3 text-xs font-bold rounded-full shadow-lg">
                  {unreadCount}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleNotifications}
                className="relative text-gray-600 hover:text-gray-900 hover:bg-white/50 w-10 h-10 p-0 rounded-[14px] transition-all duration-300"
              >
                {notificationsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>

              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-3 px-4 py-2 rounded-[14px] hover:bg-white/50 transition-all duration-300 glass-hover"
                >
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/0BEuUGcK_400x400%20%281%29-0iWevp0tLXfJLfE4K0j2w597j1PN2r.jpg"
                    alt="User"
                    className="w-8 h-8 rounded-[12px] flex-shrink-0"
                  />
                  <span className="text-sm font-mono text-gray-700 hidden sm:inline tracking-tight">
                    {formatAddress(walletAddress)}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-3 w-72 glass-card rounded-[20px] float-shadow py-2 z-10 border border-white/60">
                    <div className="px-5 py-4 border-b border-gray-200/50">
                      <p className="text-xs text-gray-500 font-medium mb-1.5 tracking-tight">
                        {walletSource === "external" ? "Connected Wallet" : "Custodial Wallet"}
                      </p>
                      <p className="text-sm font-mono text-gray-900 truncate tracking-tight">{walletAddress}</p>
                      {isTelegramMiniApp && (
                        <p className="text-[11px] text-[#16CE5E] font-semibold mt-2">📱 Telegram Mini App</p>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-5 py-3 text-left text-sm text-red-600 hover:bg-red-50/50 flex items-center gap-3 font-semibold tracking-tight transition-all duration-300"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-12 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-center">
              <div className="inline-flex items-center px-5 py-2.5 glass-card rounded-full float-shadow">
                <span className="text-sm font-semibold text-gray-700 tracking-tight">Inbox</span>
              </div>
            </div>

            <div className="glass-card rounded-[28px] float-shadow border border-white/60 overflow-hidden">
              <div className="px-6 md:px-8 pt-6 md:pt-7 pb-4 md:pb-5 border-b border-gray-200/50 flex items-center justify-between">
                <button
                  onClick={() => setShowSendModal(true)}
                  className="group flex items-center gap-3 h-11 px-5 hover:bg-white/60 rounded-[16px] transition-all duration-300 glass-hover"
                >
                  <div className="relative w-9 h-9 rounded-[14px] bg-gradient-to-br from-[#16CE5E]/10 via-white/50 to-[#16CE5E]/5 flex items-center justify-center flex-shrink-0">
                    <div className="absolute inset-[1px] rounded-[13px] bg-gradient-to-br from-white/90 to-white/50" />
                    <Edit3 className="relative w-4 h-4 text-[#16CE5E]" />
                  </div>
                  <span className="text-[15px] font-semibold text-gray-900 tracking-tight">Compose</span>
                </button>

                <div className="flex items-center gap-4">
                  <p className="hidden sm:block text-sm text-gray-500 font-medium tracking-tight">
                    {messages.length} message{messages.length !== 1 ? "s" : ""}
                    {unreadCount > 0 && <span className="ml-2 text-red-600 font-bold">({unreadCount} unread)</span>}
                  </p>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => loadMessages(walletAddress)}
                    disabled={loading}
                    className="h-10 w-10 p-0 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-[14px] transition-all duration-300"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="all" className="w-full">
                <div className="border-b border-gray-200/50 px-6 md:px-8 pt-4">
                  <TabsList className="bg-transparent h-11 gap-2">
                    <TabsTrigger
                      value="all"
                      className="data-[state=active]:glass-card data-[state=active]:text-[#16CE5E] data-[state=inactive]:text-gray-500 rounded-[14px] px-5 font-semibold text-sm tracking-tight transition-all duration-300 data-[state=active]:shadow-sm"
                    >
                      All
                      {unreadMessages.length > 0 ? (
                        <Badge className="ml-2.5 bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-500 hover:to-red-600 h-5 px-2 text-xs font-bold rounded-full shadow-sm">
                          {unreadMessages.length}
                        </Badge>
                      ) : (
                        <Badge className="ml-2.5 bg-[#16CE5E]/15 text-[#16CE5E] hover:bg-[#16CE5E]/15 h-5 px-2 text-xs font-bold rounded-full">
                          {messages.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="onchain"
                      className="data-[state=active]:glass-card data-[state=active]:text-[#16CE5E] data-[state=inactive]:text-gray-500 rounded-[14px] px-5 font-semibold text-sm tracking-tight transition-all duration-300 data-[state=active]:shadow-sm"
                    >
                      <span className="hidden sm:inline">On-Chain</span>
                      <span className="sm:hidden">On</span>
                      {unreadOnChain > 0 ? (
                        <Badge className="ml-2.5 bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-500 hover:to-red-600 h-5 px-2 text-xs font-bold rounded-full shadow-sm">
                          {unreadOnChain}
                        </Badge>
                      ) : (
                        <Badge className="ml-2.5 bg-[#16CE5E]/15 text-[#16CE5E] hover:bg-[#16CE5E]/15 h-5 px-2 text-xs font-bold rounded-full">
                          {onChainMessages.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="offchain"
                      className="data-[state=active]:glass-card data-[state=active]:text-[#16CE5E] data-[state=inactive]:text-gray-500 rounded-[14px] px-5 font-semibold text-sm tracking-tight transition-all duration-300 data-[state=active]:shadow-sm"
                    >
                      <span className="hidden sm:inline">Off-Chain</span>
                      <span className="sm:hidden">Off</span>
                      {unreadOffChain > 0 ? (
                        <Badge className="ml-2.5 bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-500 hover:to-red-600 h-5 px-2 text-xs font-bold rounded-full shadow-sm">
                          {unreadOffChain}
                        </Badge>
                      ) : (
                        <Badge className="ml-2.5 bg-[#16CE5E]/15 text-[#16CE5E] hover:bg-[#16CE5E]/15 h-5 px-2 text-xs font-bold rounded-full">
                          {offChainMessages.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="all" className="mt-0">
                  {loading ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="h-6 w-6 animate-spin text-[#16CE5E]" />
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200/50">
                      {messages.map((msg, idx) => (
                        <MessageRow key={msg.id || idx} message={msg} onMarkAsRead={markAsRead} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="onchain" className="mt-0">
                  {onChainMessages.length === 0 ? (
                    <div className="text-center py-16 space-y-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto">
                        <Mail className="h-6 w-6 text-gray-500" />
                      </div>
                      <p className="text-gray-900 font-semibold tracking-tight">No on-chain messages</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200/50">
                      {onChainMessages.map((msg, idx) => (
                        <MessageRow key={msg.id || idx} message={msg} onMarkAsRead={markAsRead} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="offchain" className="mt-0">
                  {offChainMessages.length === 0 ? (
                    <div className="text-center py-16 space-y-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto">
                        <Mail className="h-6 w-6 text-gray-500" />
                      </div>
                      <p className="text-gray-900 font-semibold tracking-tight">No off-chain messages</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200/50">
                      {offChainMessages.map((msg, idx) => (
                        <MessageRow key={msg.id || idx} message={msg} onMarkAsRead={markAsRead} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>

        <footer className="glass-panel border-t border-white/40 px-6 md:px-10 py-5">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6 text-xs font-medium tracking-tight md:mx-auto">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#16CE5E] shadow-sm" />
                <span className="text-gray-600">Secure</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#16CE5E] shadow-sm" />
                <span className="text-gray-600">Encrypted</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#16CE5E] shadow-sm" />
                <span className="text-gray-600">Online</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3 absolute right-10">
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-[12px] hover:bg-white/50 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all duration-300"
                aria-label="X (Twitter)"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-[12px] hover:bg-white/50 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all duration-300"
                aria-label="Telegram"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                </svg>
              </a>
            </div>
          </div>
        </footer>
      </div>

      {showSendModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-[28px] float-shadow w-full max-w-lg overflow-hidden border border-white/60">
            <div className="px-7 py-5 border-b border-gray-200/50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Send Message</h2>
              <button
                onClick={() => {
                  setShowSendModal(false)
                  setSendType(null)
                  setRecipient("")
                  setMessageContent("")
                }}
                className="w-9 h-9 rounded-[12px] hover:bg-white/50 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all duration-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-7 space-y-7">
              {!sendType ? (
                <div className="space-y-5">
                  <p className="text-sm text-gray-600 font-medium tracking-tight">Choose delivery method:</p>

                  <button
                    onClick={() => setSendType("onchain")}
                    className="w-full p-5 rounded-[18px] border border-gray-200/50 hover:border-[#16CE5E] hover:bg-[#16CE5E]/5 transition-all duration-300 text-left glass-hover"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 bg-[#16CE5E]/10 rounded-[14px] flex items-center justify-center flex-shrink-0">
                        <Lock className="w-5 h-5 text-[#16CE5E]" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 mb-1.5 tracking-tight">On-Chain</p>
                        <p className="text-xs text-gray-600 leading-relaxed tracking-tight">
                          Permanent blockchain record. Requires SOL for fees (~0.00001 SOL). Verifiable on Solscan.
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSendType("offchain")}
                    className="w-full p-5 rounded-[18px] border border-gray-200/50 hover:border-[#16CE5E] hover:bg-[#16CE5E]/5 transition-all duration-300 text-left glass-hover"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 bg-[#16CE5E]/10 rounded-[14px] flex items-center justify-center flex-shrink-0">
                        <Send className="w-5 h-5 text-[#16CE5E]" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 mb-1.5 tracking-tight">Off-Chain</p>
                        <p className="text-xs text-gray-600 leading-relaxed tracking-tight">
                          Instant delivery. No transaction fees. Stored in encrypted database.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 text-sm">
                    <Badge
                      className={
                        sendType === "onchain" ? "bg-[#16CE5E]/15 text-[#16CE5E]" : "bg-gray-100 text-gray-600"
                      }
                    >
                      {sendType === "onchain" ? "On-Chain" : "Off-Chain"}
                    </Badge>
                    <button
                      onClick={() => setSendType(null)}
                      className="text-gray-500 hover:text-gray-900 font-semibold tracking-tight transition-colors"
                    >
                      Change
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-gray-900 tracking-tight">Recipient</label>
                    <Input
                      placeholder="Recipient wallet address"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="h-12 bg-gray-50/50 border-gray-200/50 rounded-[14px] font-mono text-sm backdrop-blur-xl"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-gray-900 tracking-tight">Message</label>
                    <Textarea
                      placeholder="Type your message..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      rows={5}
                      className="bg-gray-50/50 border-gray-200/50 rounded-[14px] resize-none text-sm backdrop-blur-xl"
                    />
                  </div>

                  <div className="flex gap-4 pt-5">
                    <Button
                      onClick={() => setSendType(null)}
                      variant="outline"
                      className="flex-1 h-12 rounded-[14px] font-semibold border-gray-200/50 hover:bg-white/60"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={sending || !recipient || !messageContent}
                      className="flex-1 h-12 bg-[#16CE5E] hover:bg-[#14BA54] text-white font-bold rounded-[14px] shadow-lg transition-all duration-300"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MessageRow({ message, onMarkAsRead }: { message: Message; onMarkAsRead: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)

  const handleExpand = () => {
    if (!expanded && !message.read && message.id) {
      onMarkAsRead(message.id)
    }
    setExpanded(!expanded)
  }

  const formatAddress = (address: string) => {
    if (address === "Courier Team") return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const isWelcomeMessage = message.from === "Courier Team"

  return (
    <div
      className={`px-6 md:px-8 py-5 md:py-6 hover:bg-white/60 transition-all duration-300 cursor-pointer glass-hover ${!message.read ? "bg-[#16CE5E]/5" : ""}`}
      onClick={handleExpand}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {isWelcomeMessage ? (
            <div
              className={`w-11 h-11 bg-[#16CE5E]/15 rounded-[16px] flex items-center justify-center flex-shrink-0 relative`}
            >
              <Mail className="w-5 h-5 text-[#16CE5E]" />
              {!message.read && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gradient-to-br from-red-500 to-red-600 rounded-full border-2 border-white shadow-sm" />
              )}
            </div>
          ) : (
            <div className="relative w-11 h-11 flex-shrink-0">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/0BEuUGcK_400x400%20%281%29-0iWevp0tLXfJLfE4K0j2w597j1PN2r.jpg"
                alt="User"
                className="w-11 h-11 rounded-[16px]"
              />
              {!message.read && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gradient-to-br from-red-500 to-red-600 rounded-full border-2 border-white shadow-sm" />
              )}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2.5">
              <p className={`text-sm ${!message.read ? "font-bold" : "font-semibold"} text-gray-900 tracking-tight`}>
                {formatAddress(message.from)}
              </p>
              {!isWelcomeMessage && (
                <Badge
                  variant={message.onChain ? "default" : "secondary"}
                  className={
                    message.onChain
                      ? "bg-[#16CE5E]/15 text-[#16CE5E] hover:bg-[#16CE5E]/15 text-xs font-semibold h-5 px-2.5 rounded-full"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-100 text-xs font-semibold h-5 px-2.5 rounded-full"
                  }
                >
                  {message.onChain ? "On-Chain" : "Off-Chain"}
                </Badge>
              )}
              {!message.read && (
                <Badge className="bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-500 hover:to-red-600 text-[11px] font-bold h-5 px-2 rounded-full shadow-sm">
                  NEW
                </Badge>
              )}
            </div>

            {!expanded ? (
              <p
                className={`text-[15px] ${!message.read ? "text-gray-900 font-medium" : "text-gray-600 font-normal"} tracking-tight leading-relaxed line-clamp-2`}
              >
                {message.message}
              </p>
            ) : (
              <div
                className="glass-card rounded-[20px] border border-white/60 p-6 md:p-7 float-shadow mt-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-6">
                  <div className="border-b border-gray-200/50 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-base font-bold text-gray-900 mb-1.5 tracking-tight">{message.from}</p>
                        <p className="text-xs text-gray-500 font-medium tracking-tight">
                          {new Date(message.timestamp).toLocaleString("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {message.onChain && (
                        <Badge className="bg-[#16CE5E]/15 text-[#16CE5E] hover:bg-[#16CE5E]/15 text-xs font-semibold h-6 px-3 rounded-full">
                          On-Chain
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-medium tracking-tight">To: {formatAddress(message.to)}</p>
                  </div>

                  <div className="prose prose-sm max-w-none">
                    <p className="text-[15px] text-gray-700 leading-relaxed tracking-tight whitespace-pre-wrap">
                      {message.message}
                    </p>
                  </div>

                  {isWelcomeMessage && (
                    <div className="border-t border-gray-200/50 pt-6 mt-6">
                      <div className="flex items-center gap-4">
                        <img
                          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/0BEuUGcK_400x400%20%281%29-0iWevp0tLXfJLfE4K0j2w597j1PN2r.jpg"
                          alt="Courier"
                          className="w-11 h-11 rounded-[14px]"
                        />
                        <div>
                          <p className="text-sm font-bold text-gray-900 tracking-tight">Courier Team</p>
                          <p className="text-xs text-gray-500 font-medium tracking-tight">Private. Fast. Encrypted.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {message.txSignature && (
                    <div className="border-t border-gray-200/50 pt-5 mt-5">
                      <a
                        href={`https://solscan.io/tx/${message.txSignature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-[#16CE5E] hover:text-[#14BA54] transition-colors font-semibold tracking-tight"
                      >
                        View Transaction
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <span className="text-xs text-gray-500 whitespace-nowrap font-medium tracking-tight mt-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  )
}
