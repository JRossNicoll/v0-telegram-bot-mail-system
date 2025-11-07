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
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { usePrivy } from "@privy-io/react-auth"
import { WalletButton } from "@/components/wallet-button"

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
  const { ready, authenticated, user } = usePrivy()
  const [isTelegramMiniApp, setIsTelegramMiniApp] = useState(false)

  useEffect(() => {
    const isTelegram = typeof window !== "undefined" && !!(window as any).Telegram?.WebApp?.initData
    setIsTelegramMiniApp(isTelegram)

    if (ready && authenticated && user) {
      const solanaWallet = user.linkedAccounts.find(
        (account) => account.type === "wallet" && account.chainType === "solana",
      )

      if (solanaWallet && "address" in solanaWallet) {
        const connectedAddress = solanaWallet.address
        console.log("[v0] Privy wallet authenticated:", connectedAddress)
        setWalletAddress(connectedAddress)
        setIsAuthenticated(true)
        setWalletSource("external")
        localStorage.setItem("walletAddress", connectedAddress)
        localStorage.setItem("walletSource", "external")
        loadMessages(connectedAddress)
        return
      }
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
    } else if (ready && !authenticated) {
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
  }, [router, ready, authenticated, user])

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
    <div className="min-h-screen bg-[#0A0A0A] flex">
      {/* Mobile sidebar */}
      <aside className="md:hidden fixed left-0 top-0 bottom-0 w-16 bg-[#0A0A0A] border-r border-[#16CE5E]/10 flex flex-col items-center py-6 space-y-6 z-30">
        <Link href="/" className="relative group">
          <div className="absolute inset-0 bg-[#16CE5E] opacity-0 group-hover:opacity-10 blur-xl transition-opacity rounded-xl" />
          <Image src="/logo.png" alt="COURIER" width={40} height={40} className="relative z-10 rounded-xl" />
        </Link>

        <nav className="flex-1 flex flex-col space-y-4">
          <button className="relative w-10 h-10 rounded-xl bg-[#16CE5E]/10 flex items-center justify-center text-[#16CE5E]">
            <Mail className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => loadMessages(walletAddress)}
            className="relative w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleNotifications}
            className="relative w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60"
          >
            {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowSendModal(true)}
            className="relative w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60"
          >
            <Send className="w-4 h-4" />
          </button>
        </nav>

        <button
          onClick={handleLogout}
          className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-white/40"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-24 bg-[#0A0A0A] border-r border-[#16CE5E]/10 flex-col items-center py-6 space-y-8">
        <Link href="/" className="relative group">
          <div className="absolute inset-0 bg-[#16CE5E] opacity-0 group-hover:opacity-10 blur-xl transition-opacity rounded-xl" />
          <Image src="/logo.png" alt="COURIER" width={48} height={48} className="relative z-10 rounded-xl" />
        </Link>

        <nav className="flex-1 flex flex-col space-y-4">
          <button className="relative w-12 h-12 rounded-xl bg-[#16CE5E]/10 flex items-center justify-center text-[#16CE5E] hover:bg-[#16CE5E]/20 transition-colors group">
            <Mail className="w-5 h-5" />
            <span className="absolute left-16 bg-[#16CE5E] text-black text-xs font-semibold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Inbox
            </span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => loadMessages(walletAddress)}
            className="relative w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white/90 transition-colors group"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="absolute left-16 bg-white text-black text-xs font-semibold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Refresh
            </span>
          </button>

          <button
            onClick={toggleNotifications}
            className="relative w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white/90 transition-colors group"
          >
            {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            <span className="absolute left-16 bg-white text-black text-xs font-semibold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {notificationsEnabled ? "Notifications On" : "Notifications Off"}
            </span>
          </button>

          <button
            onClick={() => setShowSendModal(true)}
            className="relative w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white/90 transition-colors group"
          >
            <Send className="w-5 h-5" />
            <span className="absolute left-16 bg-white text-black text-xs font-semibold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Send Message
            </span>
          </button>
        </nav>

        <button
          onClick={handleLogout}
          className="w-12 h-12 rounded-xl hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-white/60 transition-colors group relative"
        >
          <LogOut className="w-5 h-5" />
          <span className="absolute left-16 bg-white text-black text-xs font-semibold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Logout
          </span>
        </button>
      </aside>

      {/* Main content area */}
      <div className="flex-1 bg-[#FAFAFA] flex flex-col ml-16 md:ml-0">
        <header className="bg-white/80 backdrop-blur-xl border-b border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="px-4 md:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <h1 className="text-lg md:text-xl font-black text-[#000000] tracking-tight">Courier</h1>
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#16CE5E]/10">
                <Lock className="w-3 h-3 text-[#16CE5E]" />
                <span className="text-xs font-semibold text-[#16CE5E] tracking-tight">Encrypted</span>
              </div>
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white hover:bg-red-500 h-5 px-2 text-xs font-bold rounded-md">
                  {unreadCount}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <WalletButton />

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleNotifications}
                className="relative text-[#000000]/40 hover:text-[#000000]/70 hover:bg-black/5 w-9 h-9 p-0 rounded-lg"
              >
                {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>

              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg hover:bg-black/5 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src="/user-avatar.png"
                      alt="User"
                      width={28}
                      height={28}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-sm font-mono text-[#000000]/70 hidden sm:inline tracking-tight">
                    {formatAddress(walletAddress)}
                  </span>
                  <ChevronDown className="h-4 w-4 text-[#000000]/40" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-black/[0.06] py-2 z-10">
                    <div className="px-4 py-3 border-b border-black/[0.06]">
                      <p className="text-xs text-[#000000]/50 font-medium mb-1 tracking-tight">
                        {walletSource === "external" ? "Connected Wallet" : "Custodial Wallet"}
                      </p>
                      <p className="text-sm font-mono text-[#000000] truncate tracking-tight">{walletAddress}</p>
                      {isTelegramMiniApp && (
                        <p className="text-[10px] text-[#16CE5E] font-medium mt-1">📱 Telegram Mini App</p>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium tracking-tight"
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

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-xl border border-black/[0.06] rounded-full shadow-sm">
                <span className="text-sm font-semibold text-[#000000]/70 tracking-tight">Inbox</span>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-black/[0.06] overflow-hidden">
              <div className="px-4 md:px-6 pt-4 md:pt-5 pb-3 md:pb-4 border-b border-black/[0.06] flex items-center justify-between">
                <button
                  onClick={() => setShowSendModal(true)}
                  className="group flex items-center gap-2 md:gap-2.5 h-9 md:h-10 px-3 md:px-4 hover:bg-black/[0.02] rounded-xl transition-all"
                >
                  <div className="relative w-7 h-7 md:w-8 md:h-8 rounded-xl bg-gradient-to-br from-blue-100 via-white to-emerald-50 flex items-center justify-center flex-shrink-0">
                    <div className="absolute inset-[1px] rounded-[11px] bg-gradient-to-br from-white/80 to-white/40" />
                    <Edit3 className="relative w-3.5 h-3.5 md:w-4 md:h-4 text-[#16CE5E]" />
                  </div>
                  <span className="text-sm md:text-[15px] font-semibold text-[#000000] tracking-tight">Compose</span>
                </button>

                <div className="flex items-center gap-2 md:gap-3">
                  <p className="hidden sm:block text-sm text-[#000000]/50 font-medium tracking-tight">
                    {messages.length} message{messages.length !== 1 ? "s" : ""}
                    {unreadCount > 0 && <span className="ml-2 text-red-500 font-bold">({unreadCount} unread)</span>}
                  </p>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => loadMessages(walletAddress)}
                    disabled={loading}
                    className="h-9 w-9 p-0 text-[#000000]/60 hover:text-[#000000] hover:bg-black/5 rounded-lg"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="all" className="w-full">
                <div className="border-b border-black/[0.06] px-4 md:px-6 pt-3">
                  <TabsList className="bg-transparent h-10 gap-1">
                    <TabsTrigger
                      value="all"
                      className="data-[state=active]:bg-[#16CE5E]/10 data-[state=active]:text-[#16CE5E] data-[state=inactive]:text-[#000000]/50 rounded-lg px-3 md:px-4 font-medium text-sm tracking-tight transition-all"
                    >
                      All
                      {unreadMessages.length > 0 ? (
                        <Badge className="ml-2 bg-red-500 text-white hover:bg-red-500 h-5 px-1.5 text-xs font-semibold rounded-md">
                          {unreadMessages.length}
                        </Badge>
                      ) : (
                        <Badge className="ml-2 bg-[#16CE5E]/20 text-[#16CE5E] hover:bg-[#16CE5E]/20 h-5 px-1.5 text-xs font-semibold rounded-md">
                          {messages.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="onchain"
                      className="data-[state=active]:bg-[#16CE5E]/10 data-[state=active]:text-[#16CE5E] data-[state=inactive]:text-[#000000]/50 rounded-lg px-3 md:px-4 font-medium text-sm tracking-tight transition-all"
                    >
                      <span className="hidden sm:inline">On-Chain</span>
                      <span className="sm:hidden">On</span>
                      {unreadOnChain > 0 ? (
                        <Badge className="ml-2 bg-red-500 text-white hover:bg-red-500 h-5 px-1.5 text-xs font-semibold rounded-md">
                          {unreadOnChain}
                        </Badge>
                      ) : (
                        <Badge className="ml-2 bg-[#16CE5E]/20 text-[#16CE5E] hover:bg-[#16CE5E]/20 h-5 px-1.5 text-xs font-semibold rounded-md">
                          {onChainMessages.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="offchain"
                      className="data-[state=active]:bg-[#16CE5E]/10 data-[state=active]:text-[#16CE5E] data-[state=inactive]:text-[#000000]/50 rounded-lg px-3 md:px-4 font-medium text-sm tracking-tight transition-all"
                    >
                      <span className="hidden sm:inline">Off-Chain</span>
                      <span className="sm:hidden">Off</span>
                      {unreadOffChain > 0 ? (
                        <Badge className="ml-2 bg-red-500 text-white hover:bg-red-500 h-5 px-1.5 text-xs font-semibold rounded-md">
                          {unreadOffChain}
                        </Badge>
                      ) : (
                        <Badge className="ml-2 bg-[#16CE5E]/20 text-[#16CE5E] hover:bg-[#16CE5E]/20 h-5 px-1.5 text-xs font-semibold rounded-md">
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
                    <div className="divide-y divide-black/[0.04]">
                      {messages.map((msg, idx) => (
                        <MessageRow key={msg.id || idx} message={msg} onMarkAsRead={markAsRead} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="onchain" className="mt-0">
                  {onChainMessages.length === 0 ? (
                    <div className="text-center py-16 space-y-3">
                      <div className="w-12 h-12 bg-[#F5F5F5] rounded-xl flex items-center justify-center mx-auto">
                        <Mail className="h-6 w-6 text-[#000000]/30" />
                      </div>
                      <p className="text-[#000000] font-semibold tracking-tight">No on-chain messages</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-black/[0.04]">
                      {onChainMessages.map((msg, idx) => (
                        <MessageRow key={msg.id || idx} message={msg} onMarkAsRead={markAsRead} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="offchain" className="mt-0">
                  {offChainMessages.length === 0 ? (
                    <div className="text-center py-16 space-y-3">
                      <div className="w-12 h-12 bg-[#F5F5F5] rounded-xl flex items-center justify-center mx-auto">
                        <Mail className="h-6 w-6 text-[#000000]/30" />
                      </div>
                      <p className="text-[#000000] font-semibold tracking-tight">No off-chain messages</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-black/[0.04]">
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

        <footer className="bg-white/80 backdrop-blur-xl border-t border-black/[0.06] px-4 md:px-8 py-3 md:py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4 text-xs font-medium tracking-tight md:mx-auto">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#16CE5E]" />
                <span className="text-[#000000]/60">Secure</span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#16CE5E]" />
                <span className="text-[#000000]/60">Encrypted</span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#16CE5E]" />
                <span className="text-[#000000]/60">Online</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 absolute right-8">
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-[#000000]/40 hover:text-[#000000]/70 transition-colors"
                aria-label="X (Twitter)"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-[#000000]/40 hover:text-[#000000]/70 transition-colors"
                aria-label="Telegram"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                </svg>
              </a>
            </div>
          </div>
        </footer>
      </div>

      {showSendModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between">
              <h2 className="text-lg font-black text-[#000000] tracking-tight">Send Message</h2>
              <button
                onClick={() => {
                  setShowSendModal(false)
                  setSendType(null)
                  setRecipient("")
                  setMessageContent("")
                }}
                className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-[#000000]/40 hover:text-[#000000] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {!sendType ? (
                <div className="space-y-4">
                  <p className="text-sm text-[#000000]/70 font-medium tracking-tight">Choose delivery method:</p>

                  <button
                    onClick={() => setSendType("onchain")}
                    className="w-full p-4 rounded-xl border-2 border-black/[0.06] hover:border-[#16CE5E] hover:bg-[#16CE5E]/5 transition-all text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-[#16CE5E]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Lock className="w-5 h-5 text-[#16CE5E]" />
                      </div>
                      <div>
                        <p className="font-bold text-[#000000] mb-1 tracking-tight">On-Chain</p>
                        <p className="text-xs text-[#000000]/60 leading-relaxed tracking-tight">
                          Permanent blockchain record. Requires SOL for fees (~0.00001 SOL). Verifiable on Solscan.
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSendType("offchain")}
                    className="w-full p-4 rounded-xl border-2 border-black/[0.06] hover:border-[#16CE5E] hover:bg-[#16CE5E]/5 transition-all text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-[#16CE5E]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Send className="w-5 h-5 text-[#16CE5E]" />
                      </div>
                      <div>
                        <p className="font-bold text-[#000000] mb-1 tracking-tight">Off-Chain</p>
                        <p className="text-xs text-[#000000]/60 leading-relaxed tracking-tight">
                          Instant delivery. No transaction fees. Stored in encrypted database.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge
                      className={
                        sendType === "onchain" ? "bg-[#16CE5E]/10 text-[#16CE5E]" : "bg-[#F5F5F5] text-[#000000]/50"
                      }
                    >
                      {sendType === "onchain" ? "On-Chain" : "Off-Chain"}
                    </Badge>
                    <button
                      onClick={() => setSendType(null)}
                      className="text-[#000000]/40 hover:text-[#000000] font-medium tracking-tight"
                    >
                      Change
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#000000] tracking-tight">Recipient</label>
                    <Input
                      placeholder="Recipient wallet address"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="h-11 bg-[#F5F5F5] border-0 rounded-lg font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#000000] tracking-tight">Message</label>
                    <Textarea
                      placeholder="Type your message..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      rows={5}
                      className="bg-[#F5F5F5] border-0 rounded-lg resize-none text-sm"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => setSendType(null)}
                      variant="outline"
                      className="flex-1 h-11 rounded-lg font-semibold"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={sending || !recipient || !messageContent}
                      className="flex-1 h-11 bg-[#16CE5E] hover:bg-[#14B854] text-[#000000] font-bold rounded-lg"
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
      className={`px-4 md:px-6 py-4 md:py-5 hover:bg-[#F5F5F5] transition-colors cursor-pointer ${!message.read ? "bg-[#16CE5E]/5" : ""}`}
      onClick={handleExpand}
    >
      <div className="flex items-start justify-between gap-3 md:gap-4">
        <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
          <div
            className={`w-10 h-10 ${isWelcomeMessage ? "bg-[#16CE5E]/20" : "bg-[#16CE5E]/10"} rounded-xl flex items-center justify-center flex-shrink-0 relative`}
          >
            {isWelcomeMessage ? (
              <Mail className="w-5 h-5 text-[#16CE5E]" />
            ) : (
              <Send className="w-4 h-4 text-[#16CE5E]" />
            )}
            {!message.read && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 md:gap-3 mb-2">
              <p className={`text-sm ${!message.read ? "font-black" : "font-bold"} text-[#000000] tracking-tight`}>
                {formatAddress(message.from)}
              </p>
              {!isWelcomeMessage && (
                <Badge
                  variant={message.onChain ? "default" : "secondary"}
                  className={
                    message.onChain
                      ? "bg-[#16CE5E]/10 text-[#16CE5E] hover:bg-[#16CE5E]/10 text-xs font-medium h-5 px-2 rounded-md"
                      : "bg-[#F5F5F5] text-[#000000]/50 hover:bg-[#F5F5F5] text-xs font-medium h-5 px-2 rounded-md"
                  }
                >
                  {message.onChain ? "On-Chain" : "Off-Chain"}
                </Badge>
              )}
              {!message.read && (
                <Badge className="bg-red-500 text-white hover:bg-red-500 text-[10px] font-bold h-5 px-1.5 rounded-md">
                  NEW
                </Badge>
              )}
            </div>

            {!expanded ? (
              <p
                className={`text-sm md:text-[15px] ${!message.read ? "text-[#000000] font-medium" : "text-[#000000]/70 font-normal"} tracking-tight leading-relaxed line-clamp-2`}
              >
                {message.message}
              </p>
            ) : (
              <div
                className="bg-white rounded-xl border border-black/[0.06] p-4 md:p-6 shadow-sm mt-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-4 md:space-y-6">
                  <div className="border-b border-black/[0.06] pb-3 md:pb-4">
                    <div className="flex items-start justify-between mb-2 md:mb-3">
                      <div>
                        <p className="text-base font-bold text-[#000000] mb-1 tracking-tight">{message.from}</p>
                        <p className="text-xs text-[#000000]/50 font-medium tracking-tight">
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
                        <Badge className="bg-[#16CE5E]/10 text-[#16CE5E] hover:bg-[#16CE5E]/10 text-xs font-medium h-6 px-2.5 rounded-md">
                          On-Chain
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-[#000000]/40 font-medium tracking-tight">
                      To: {formatAddress(message.to)}
                    </p>
                  </div>

                  <div className="prose prose-sm max-w-none">
                    <p className="text-sm md:text-[15px] text-[#000000]/90 leading-relaxed tracking-tight whitespace-pre-wrap">
                      {message.message}
                    </p>
                  </div>

                  {isWelcomeMessage && (
                    <div className="border-t border-black/[0.06] pt-4 md:pt-6 mt-4 md:mt-6">
                      <div className="flex items-center gap-3">
                        <Image src="/logo.png" alt="Courier" width={40} height={40} className="rounded-lg" />
                        <div>
                          <p className="text-sm font-bold text-[#000000] tracking-tight">Courier Team</p>
                          <p className="text-xs text-[#000000]/50 font-medium tracking-tight">
                            Private. Fast. Encrypted.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {message.txSignature && (
                    <div className="border-t border-black/[0.06] pt-4 mt-4">
                      <a
                        href={`https://solscan.io/tx/${message.txSignature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-[#16CE5E] hover:text-[#14B854] transition-colors font-semibold tracking-tight"
                      >
                        View Transaction
                        <ExternalLink className="ml-1.5 h-4 w-4" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <span className="text-xs text-[#000000]/40 whitespace-nowrap font-medium tracking-tight mt-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  )
}
