import { type NextRequest, NextResponse } from "next/server"
import { sendMessage } from "@/lib/telegram/api"
import { connectWallet, getUser, getEncryptedPrivateKey, getTelegramIdByWallet } from "@/lib/storage/users"
import { saveMessage, getMessagesForWallet } from "@/lib/storage/messages"
import { sendOnChainMessage, getWalletBalance } from "@/lib/solana/transactions"
import {
  startSendConversation,
  getConversationState,
  updateConversationState,
  clearConversation,
} from "@/lib/storage/conversations"
import { redis } from "@/lib/redis"
import { decryptPrivateKey } from "@/lib/solana/wallet"
import bs58 from "bs58"

export async function POST(request: NextRequest) {
  try {
    const update = await request.json()
    console.log("[v0] ===== NEW UPDATE RECEIVED =====")
    console.log("[v0] Full update:", JSON.stringify(update, null, 2))

    if (update.callback_query) {
      const callbackQuery = update.callback_query
      const chatId = callbackQuery.message.chat.id
      const data = callbackQuery.data

      console.log("[v0] ===== CALLBACK QUERY DETECTED =====")
      console.log("[v0] Callback data:", data)
      console.log("[v0] Chat ID:", chatId)
      console.log("[v0] User ID:", callbackQuery.from.id)
      console.log("[v0] =====================================")

      if (data === "test_callback") {
        await sendMessage(chatId, "✅ <b>CALLBACK WORKS!</b>\n\nButtons are functioning correctly.")
        return NextResponse.json({ ok: true })
      }

      if (data === "connect_wallet") {
        console.log("[v0] Handling connect_wallet callback")
        const userId = callbackQuery.from.id.toString()
        console.log("[v0] Connect wallet button clicked")
        console.log("[v0] User ID from callback:", userId)
        console.log("[v0] User ID type:", typeof userId)

        const miniAppUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app"}/?userId=${userId}&telegram=true`
        console.log("[v0] Mini app URL:", miniAppUrl)

        await sendMessage(
          chatId,
          "✨ <b>Connect Your Wallet</b>\n\n" +
            "Open the Courier app to connect your wallet:\n\n" +
            "  • Connect Phantom, Solflare, or Backpack wallet\n" +
            "  • Access your encrypted inbox\n" +
            "  • Send on-chain and off-chain messages\n\n" +
            "Or use /connect command with your wallet address for quick setup.",
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🚀 Open Courier App",
                    web_app: { url: miniAppUrl },
                  },
                ],
                [
                  {
                    text: "← Back",
                    callback_data: "main_menu",
                  },
                ],
              ],
            },
          },
        )
      }

      if (data === "main_menu") {
        await sendMessage(
          chatId,
          "🌟 <b>Solana Mail</b>\n\n" +
            "Decentralized messaging on Solana blockchain.\n\n" +
            "Send permanent, verifiable messages to any wallet address.",
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🔐 Connect Wallet",
                    callback_data: "connect_wallet",
                  },
                ],
                [
                  {
                    text: "💡 Learn More",
                    callback_data: "show_help",
                  },
                ],
              ],
            },
          },
        )
      }

      if (data === "view_inbox") {
        const userId = callbackQuery.from.id.toString()
        const user = await getUser(userId)

        if (!user) {
          await sendMessage(chatId, "⚠️ <b>Wallet Required</b>\n\nConnect your wallet to access messages.", {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🔐 Connect Wallet",
                    callback_data: "connect_wallet",
                  },
                ],
              ],
            },
          })
          return NextResponse.json({ ok: true })
        }

        const messages = await getMessagesForWallet(user.walletAddress)

        if (messages.length === 0) {
          await sendMessage(
            chatId,
            "📭 <b>Inbox</b>\n\n" + "No messages yet.\n\n" + `Share your address:\n<code>${user.walletAddress}</code>`,
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "📤 Send Message",
                      callback_data: "choose_send_type",
                    },
                  ],
                  [
                    {
                      text: "← Back",
                      callback_data: "wallet_menu",
                    },
                  ],
                ],
              },
            },
          )
          return NextResponse.json({ ok: true })
        }

        let inboxText = "📬 <b>Messages</b>\n\n"
        messages.slice(0, 10).forEach((msg, index) => {
          const badge = msg.onChain ? "⛓" : "💬"
          inboxText += `${badge} <code>${msg.from.slice(0, 6)}...${msg.from.slice(-4)}</code>\n`
          inboxText += `   ${msg.message}\n`
          if (msg.txSignature) {
            inboxText += `   <a href="https://solscan.io/tx/${msg.txSignature}">View Transaction →</a>\n`
          }
          inboxText += `\n`
        })

        if (messages.length > 10) {
          inboxText += `\n<i>Showing 10 of ${messages.length} messages</i>`
        }

        await sendMessage(chatId, inboxText, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔄 Refresh",
                  callback_data: "view_inbox",
                },
              ],
              [
                {
                  text: "← Back",
                  callback_data: "wallet_menu",
                },
              ],
            ],
          },
        })
      }

      if (data === "wallet_menu") {
        const userId = callbackQuery.from.id.toString()
        const user = await getUser(userId)

        if (!user) {
          await sendMessage(chatId, "⚠️ Wallet not connected", {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🔐 Connect Wallet",
                    callback_data: "connect_wallet",
                  },
                ],
              ],
            },
          })
          return NextResponse.json({ ok: true })
        }

        const balance = await getWalletBalance(user.walletAddress)

        await sendMessage(
          chatId,
          `💼 <b>Wallet</b>\n\n` +
            `<code>${user.walletAddress.slice(0, 8)}...${user.walletAddress.slice(-8)}</code>\n\n` +
            `Balance: <b>${balance.toFixed(4)} SOL</b>`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "📤 Send",
                    callback_data: "choose_send_type",
                  },
                  {
                    text: "📬 Inbox",
                    callback_data: "view_inbox",
                  },
                ],
                [
                  {
                    text: "🔑 Export Private Key",
                    callback_data: "export_private_key",
                  },
                ],
                [
                  {
                    text: "🔄 Refresh Balance",
                    callback_data: "wallet_menu",
                  },
                ],
                [
                  {
                    text: "← Main Menu",
                    callback_data: "main_menu",
                  },
                ],
              ],
            },
          },
        )
      }

      if (data === "choose_send_type") {
        console.log("[v0] ===== CHOOSE_SEND_TYPE TRIGGERED =====")
        const userId = callbackQuery.from.id.toString()
        console.log("[v0] User ID:", userId)

        const user = await getUser(userId)
        console.log("[v0] User found:", user ? "YES" : "NO")
        console.log("[v0] User data:", JSON.stringify(user, null, 2))

        if (!user) {
          console.log("[v0] No user found, sending wallet required message")
          await sendMessage(chatId, "⚠️ Wallet required", {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🔐 Connect Wallet",
                    callback_data: "connect_wallet",
                  },
                ],
              ],
            },
          })
          return NextResponse.json({ ok: true })
        }

        console.log("[v0] Getting wallet balance...")
        const balance = await getWalletBalance(user.walletAddress)
        console.log("[v0] Balance:", balance)

        console.log("[v0] Sending send type options message...")
        await sendMessage(
          chatId,
          "📤 <b>Send Message</b>\n\n" +
            "Choose delivery method:\n\n" +
            "<b>⛓ On-Chain</b>\n" +
            "  • Permanent blockchain record\n" +
            "  • Verifiable on Solscan\n" +
            `  • Requires: ~0.00001 SOL\n` +
            `  • Your balance: ${balance.toFixed(4)} SOL\n\n` +
            "<b>💬 Off-Chain</b>\n" +
            "  • Instant delivery\n" +
            "  • No transaction fees\n" +
            "  • Stored in database",
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "⛓ Send On-Chain",
                    callback_data: "start_send_onchain",
                  },
                ],
                [
                  {
                    text: "💬 Send Off-Chain",
                    callback_data: "start_send_offchain",
                  },
                ],
                [
                  {
                    text: "← Cancel",
                    callback_data: "wallet_menu",
                  },
                ],
              ],
            },
          },
        )
        console.log("[v0] Send type options message sent successfully")
        console.log("[v0] =========================================")
      }

      if (data === "start_send_onchain") {
        const userId = callbackQuery.from.id.toString()
        console.log("[v0] Starting on-chain send for user:", userId)
        await startSendConversation(userId, true)
        await sendMessage(chatId, "⛓ <b>On-Chain Message</b>\n\nEnter recipient wallet address:")
        return NextResponse.json({ ok: true })
      }

      if (data === "start_send_offchain") {
        const userId = callbackQuery.from.id.toString()
        console.log("[v0] Starting off-chain send for user:", userId)
        await startSendConversation(userId, false)
        await sendMessage(chatId, "💬 <b>Off-Chain Message</b>\n\nEnter recipient wallet address:")
        return NextResponse.json({ ok: true })
      }

      if (data === "show_help") {
        await sendMessage(
          chatId,
          "💡 <b>How It Works</b>\n\n" +
            "<b>1. Connect Wallet</b>\n" +
            "Generate a custodial wallet or connect your existing Solana wallet.\n\n" +
            "<b>2. Send Messages</b>\n" +
            "Choose on-chain (permanent) or off-chain (instant) delivery.\n\n" +
            "<b>3. Receive Messages</b>\n" +
            "Check your inbox for messages sent to your wallet address.\n\n" +
            "<b>On-Chain Benefits:</b>\n" +
            "  • Permanent blockchain record\n" +
            "  • Publicly verifiable\n" +
            "  • Decentralized\n" +
            "  • Censorship-resistant",
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🚀 Get Started",
                    callback_data: "connect_wallet",
                  },
                ],
                [
                  {
                    text: "⛓ How On-Chain Works",
                    callback_data: "explain_onchain",
                  },
                ],
                [
                  {
                    text: "← Back",
                    callback_data: "main_menu",
                  },
                ],
              ],
            },
          },
        )
      }

      if (data === "explain_onchain") {
        await sendMessage(
          chatId,
          "⛓ <b>On-Chain Messaging Explained</b>\n\n" +
            "<b>How it works:</b>\n" +
            "1. Your message is encoded into a Solana transaction\n" +
            "2. A small amount (0.000001 SOL) is sent to the recipient\n" +
            "3. Your message is stored in the transaction memo field\n" +
            "4. The transaction is broadcast to Solana mainnet\n" +
            "5. Once confirmed, it's permanently recorded on the blockchain\n\n" +
            "<b>Why it's powerful:</b>\n" +
            "  • <b>Permanent:</b> Can never be deleted or modified\n" +
            "  • <b>Verifiable:</b> Anyone can verify on Solscan\n" +
            "  • <b>Decentralized:</b> No central server required\n" +
            "  • <b>Censorship-resistant:</b> No one can block your messages\n\n" +
            "<b>Cost:</b> ~0.00001 SOL per message (~$0.002)\n\n" +
            "<i>Every on-chain message creates a real Solana transaction that you can view on blockchain explorers like Solscan.</i>",
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🚀 Try It Now",
                    callback_data: "connect_wallet",
                  },
                ],
                [
                  {
                    text: "← Back to Help",
                    callback_data: "show_help",
                  },
                ],
              ],
            },
          },
        )
      }

      // Handler for export private key callback
      if (data === "export_private_key") {
        const userId = callbackQuery.from.id.toString()
        const user = await getUser(userId)

        if (!user || !user.encryptedPrivateKey) {
          await sendMessage(
            chatId,
            "⚠️ <b>No Custodial Wallet Found</b>\n\nThis feature is only available for wallets generated through the bot.",
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "← Back",
                      callback_data: "wallet_menu",
                    },
                  ],
                ],
              },
            },
          )
          return NextResponse.json({ ok: true })
        }

        try {
          // Decrypt the private key
          const privateKeyBytes = decryptPrivateKey(user.encryptedPrivateKey)
          const privateKeyBase58 = bs58.encode(privateKeyBytes)

          await sendMessage(
            chatId,
            `🔑 <b>Private Key Export</b>\n\n` +
              `⚠️ <b>SECURITY WARNING:</b>\n` +
              `Never share your private key with anyone. Anyone with this key has full control of your wallet.\n\n` +
              `<b>Your Private Key:</b>\n<code>${privateKeyBase58}</code>\n\n` +
              `<b>Wallet Address:</b>\n<code>${user.walletAddress}</code>\n\n` +
              `<i>You can import this key into wallets like Phantom or Solflare.</i>\n\n` +
              `🗑 <b>Delete this message after saving your key securely.</b>`,
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "← Back to Wallet",
                      callback_data: "wallet_menu",
                    },
                  ],
                ],
              },
            },
          )
        } catch (error: any) {
          console.error("[v0] Error exporting private key:", error)
          await sendMessage(
            chatId,
            `❌ <b>Export Failed</b>\n\n${error.message || "Failed to decrypt private key"}\n\nPlease try regenerating your wallet.`,
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "← Back",
                      callback_data: "wallet_menu",
                    },
                  ],
                ],
              },
            },
          )
        }

        return NextResponse.json({ ok: true })
      }

      return NextResponse.json({ ok: true })
    }

    if (!update.message) {
      return NextResponse.json({ ok: true })
    }

    const message = update.message
    const chatId = message.chat.id
    const text = message.text || ""
    const userId = message.from?.id.toString() || ""

    const conversationState = await getConversationState(userId)

    if (conversationState && text.startsWith("/")) {
      await clearConversation(userId)
      // Continue to process the command below
    } else if (conversationState) {
      if (conversationState.step === "awaiting_wallet") {
        // Validate wallet address
        if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(text)) {
          await sendMessage(
            chatId,
            "❌ <b>Invalid Address</b>\n\n" +
              "Please enter a valid Solana wallet address (32-44 characters).\n\n" +
              "Or use /cancel to exit.",
          )
          return NextResponse.json({ ok: true })
        }

        await updateConversationState(userId, {
          step: "awaiting_message",
          data: { ...conversationState.data, toWallet: text },
        })

        await sendMessage(
          chatId,
          `✓ <b>Recipient</b>\n<code>${text.slice(0, 8)}...${text.slice(-8)}</code>\n\nEnter your message:`,
        )
        return NextResponse.json({ ok: true })
      }

      if (conversationState.step === "awaiting_message") {
        const user = await getUser(userId)
        if (!user) {
          await clearConversation(userId)
          await sendMessage(chatId, "⚠️ Session expired. Please reconnect your wallet.")
          return NextResponse.json({ ok: true })
        }

        const toWallet = conversationState.data.toWallet!
        const messageText = text
        const isOnChain = conversationState.data.isOnChain || false

        await clearConversation(userId)

        if (isOnChain) {
          const balance = await getWalletBalance(user.walletAddress)

          if (balance < 0.00001) {
            await sendMessage(
              chatId,
              "⚠️ <b>Insufficient Balance</b>\n\n" +
                `Current: ${balance.toFixed(6)} SOL\n` +
                `Required: ~0.00001 SOL\n\n` +
                `Deposit SOL to your wallet:\n<code>${user.walletAddress}</code>`,
              {
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "💬 Send Off-Chain Instead",
                        callback_data: "start_send_offchain",
                      },
                    ],
                    [
                      {
                        text: "← Back",
                        callback_data: "wallet_menu",
                      },
                    ],
                  ],
                },
              },
            )
            return NextResponse.json({ ok: true })
          }

          await sendMessage(chatId, "⏳ <b>Processing...</b>\n\nSigning and broadcasting transaction...")

          try {
            const encryptedKey = await getEncryptedPrivateKey(userId)
            if (!encryptedKey) {
              await sendMessage(chatId, "⚠️ Custodial wallet not found. Please regenerate your wallet.")
              return NextResponse.json({ ok: true })
            }

            const result = await sendOnChainMessage(encryptedKey, toWallet, messageText)
            await saveMessage(user.walletAddress, toWallet, messageText, true, result.signature)

            await sendMessage(
              chatId,
              `✓ <b>Message Delivered</b>\n\n` +
                `To: <code>${toWallet.slice(0, 6)}...${toWallet.slice(-4)}</code>\n` +
                `Message: <i>${messageText}</i>\n\n` +
                `<a href="${result.explorerUrl}">View on Solscan →</a>`,
              {
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "📤 Send Another",
                        callback_data: "choose_send_type",
                      },
                    ],
                    [
                      {
                        text: "← Wallet",
                        callback_data: "wallet_menu",
                      },
                    ],
                  ],
                },
              },
            )
          } catch (error: any) {
            console.error("[v0] On-chain send error:", error)
            await sendMessage(
              chatId,
              `⚠️ <b>Transaction Failed</b>\n\n` +
                `${error.message || "Unknown error"}\n\n` +
                `Ensure your wallet has sufficient SOL for fees.`,
              {
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "🔄 Try Again",
                        callback_data: "choose_send_type",
                      },
                    ],
                    [
                      {
                        text: "← Back",
                        callback_data: "wallet_menu",
                      },
                    ],
                  ],
                },
              },
            )
          }
        } else {
          await saveMessage(user.walletAddress, toWallet, messageText, false)

          // Notify recipient if they have a Telegram account
          const recipientTelegramId = await getTelegramIdByWallet(toWallet)
          if (recipientTelegramId) {
            try {
              await sendMessage(
                recipientTelegramId,
                `📬 <b>New Message</b>\n\n` +
                  `From: <code>${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}</code>\n` +
                  `Message: <i>${messageText}</i>`,
                {
                  reply_markup: {
                    inline_keyboard: [
                      [
                        {
                          text: "📬 View Inbox",
                          callback_data: "view_inbox",
                        },
                      ],
                      [
                        {
                          text: "↩️ Reply",
                          callback_data: "start_send_offchain",
                        },
                      ],
                    ],
                  },
                },
              )
            } catch (error) {
              console.error("[v0] Failed to notify recipient:", error)
              // Continue even if notification fails
            }
          }

          await sendMessage(
            chatId,
            `✓ <b>Message Sent</b>\n\n` +
              `To: <code>${toWallet.slice(0, 6)}...${toWallet.slice(-4)}</code>\n` +
              `Message: <i>${messageText}</i>\n\n` +
              `<i>Delivered instantly off-chain</i>`,
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "📤 Send Another",
                      callback_data: "choose_send_type",
                    },
                  ],
                  [
                    {
                      text: "← Wallet",
                      callback_data: "wallet_menu",
                    },
                  ],
                ],
              },
            },
          )
        }

        return NextResponse.json({ ok: true })
      }
    }

    if (text === "/cancel") {
      const state = await getConversationState(userId)
      if (state) {
        await clearConversation(userId)
        await sendMessage(chatId, "✓ Cancelled", {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "← Back to Wallet",
                  callback_data: "wallet_menu",
                },
              ],
            ],
          },
        })
      } else {
        await sendMessage(chatId, "No active operation to cancel")
      }
      return NextResponse.json({ ok: true })
    }

    if (text === "/start") {
      await sendMessage(
        chatId,
        "🌟 <b>Welcome to Solana Mail</b>\n\n" +
          "Decentralized messaging on Solana blockchain.\n\n" +
          "Send permanent, verifiable messages to any wallet address.",
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🧪 TEST BUTTON (Click Me!)",
                  callback_data: "test_callback",
                },
              ],
              [
                {
                  text: "🚀 Get Started",
                  callback_data: "connect_wallet",
                },
              ],
              [
                {
                  text: "💡 Learn More",
                  callback_data: "show_help",
                },
              ],
            ],
          },
        },
      )
      return NextResponse.json({ ok: true })
    }

    if (text === "/help") {
      await sendMessage(
        chatId,
        "📬 <b>Solana Mail Bot Commands:</b>\n\n" +
          "/connect &lt;wallet_address&gt; - Link your Solana wallet\n" +
          "/send &lt;wallet&gt; &lt;message&gt; - Send off-chain message\n" +
          "/sendchain &lt;wallet_address&gt; &lt;message&gt; - Send on-chain message\n" +
          "/inbox - Check your messages\n" +
          "/wallet - View connected wallet\n" +
          "/balance - Check your wallet balance\n" +
          "/debug - Troubleshoot wallet connection issues",
      )
      return NextResponse.json({ ok: true })
    }

    // Handle /connect command
    if (text.startsWith("/connect")) {
      const parts = text.split(" ")
      if (parts.length < 2) {
        await sendMessage(chatId, "❌ Usage: /connect &lt;wallet_address&gt;\n\nOr use the button below:", {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔐 Connect with Mini App",
                  callback_data: "connect_wallet",
                },
              ],
            ],
          },
        })
        return NextResponse.json({ ok: true })
      }

      const walletAddress = parts[1]

      // Basic Solana address validation (base58, 32-44 chars)
      if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
        await sendMessage(chatId, "❌ Invalid Solana wallet address format")
        return NextResponse.json({ ok: true })
      }

      await connectWallet(userId, walletAddress)

      await sendMessage(
        chatId,
        `✅ <b>Wallet Connected Successfully!</b>\n\n` +
          `<b>Address:</b>\n<code>${walletAddress}</code>\n\n` +
          `You're all set! You can now send and receive messages.`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "📤 Send Message",
                  callback_data: "choose_send_type",
                },
                {
                  text: "📬 View Inbox",
                  callback_data: "view_inbox",
                },
              ],
            ],
          },
        },
      )
      return NextResponse.json({ ok: true })
    }

    if (text === "/wallet") {
      const user = await getUser(userId)
      if (!user) {
        await sendMessage(chatId, "⚠️ No wallet connected", {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔐 Connect Wallet",
                  callback_data: "connect_wallet",
                },
              ],
            ],
          },
        })
        return NextResponse.json({ ok: true })
      }

      const balance = await getWalletBalance(user.walletAddress)
      await sendMessage(
        chatId,
        `💼 <b>Wallet</b>\n\n` +
          `<code>${user.walletAddress.slice(0, 8)}...${user.walletAddress.slice(-8)}</code>\n\n` +
          `Balance: <b>${balance.toFixed(4)} SOL</b>`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "📤 Send",
                  callback_data: "choose_send_type",
                },
                {
                  text: "📬 Inbox",
                  callback_data: "view_inbox",
                },
              ],
              [
                {
                  text: "🔑 Export Private Key",
                  callback_data: "export_private_key",
                },
              ],
              [
                {
                  text: "🔄 Refresh",
                  callback_data: "wallet_menu",
                },
              ],
            ],
          },
        },
      )
      return NextResponse.json({ ok: true })
    }

    if (text === "/send") {
      const user = await getUser(userId)

      if (!user) {
        await sendMessage(chatId, "⚠️ Wallet required", {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔐 Connect Wallet",
                  callback_data: "connect_wallet",
                },
              ],
            ],
          },
        })
        return NextResponse.json({ ok: true })
      }

      const balance = await getWalletBalance(user.walletAddress)
      await sendMessage(
        chatId,
        "📤 <b>Send Message</b>\n\n" +
          "Choose delivery method:\n\n" +
          "<b>⛓ On-Chain</b> - Permanent & verifiable\n" +
          `<b>💬 Off-Chain</b> - Instant & free\n\n` +
          `Balance: ${balance.toFixed(4)} SOL`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "⛓ On-Chain",
                  callback_data: "start_send_onchain",
                },
                {
                  text: "💬 Off-Chain",
                  callback_data: "start_send_offchain",
                },
              ],
            ],
          },
        },
      )
      return NextResponse.json({ ok: true })
    }

    if (text === "/sendchain") {
      const user = await getUser(userId)
      if (!user) {
        await sendMessage(chatId, "⚠️ Connect your wallet first:", {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔐 Connect Wallet",
                  callback_data: "connect_wallet",
                },
              ],
            ],
          },
        })
        return NextResponse.json({ ok: true })
      }

      await startSendConversation(userId, true)
      await sendMessage(chatId, "⛓ <b>Send On-Chain Message</b>\n\nWhat wallet address do you want to send to?")
      return NextResponse.json({ ok: true })
    }

    if (text === "/inbox") {
      const user = await getUser(userId)
      if (!user) {
        await sendMessage(chatId, "⚠️ Connect your wallet first:", {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔐 Connect Wallet",
                  callback_data: "connect_wallet",
                },
              ],
            ],
          },
        })
        return NextResponse.json({ ok: true })
      }

      const messages = await getMessagesForWallet(user.walletAddress)

      if (messages.length === 0) {
        await sendMessage(chatId, "📭 Your inbox is empty")
        return NextResponse.json({ ok: true })
      }

      let inboxText = "📬 <b>Your Messages:</b>\n\n"
      messages.forEach((msg, index) => {
        const chainBadge = msg.onChain ? "⛓️" : "💬"
        inboxText += `${chainBadge} <b>From:</b> <code>${msg.from}</code>\n`
        inboxText += `<i>${msg.message}</i>\n`
        if (msg.txSignature) {
          inboxText += `<b>TX:</b> <code>${msg.txSignature.slice(0, 20)}...</code>\n`
        }
        inboxText += `<b>Time:</b> ${new Date(msg.timestamp).toLocaleString()}\n\n`
      })

      await sendMessage(chatId, inboxText)
      return NextResponse.json({ ok: true })
    }

    if (text === "/balance") {
      const user = await getUser(userId)
      if (!user) {
        await sendMessage(chatId, "❌ Connect your wallet first:", {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔐 Connect Wallet",
                  callback_data: "connect_wallet",
                },
              ],
            ],
          },
        })
        return NextResponse.json({ ok: true })
      }

      try {
        const balance = await getWalletBalance(user.walletAddress)
        await sendMessage(
          chatId,
          `💰 <b>Wallet Balance</b>\n\n` +
            `<b>Address:</b>\n<code>${user.walletAddress}</code>\n\n` +
            `<b>Balance:</b> ${balance.toFixed(4)} SOL`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "📤 Send Message",
                    callback_data: "choose_send_type",
                  },
                ],
              ],
            },
          },
        )
      } catch (error) {
        await sendMessage(chatId, "❌ Failed to fetch balance. Please try again.")
      }
      return NextResponse.json({ ok: true })
    }

    if (text === "/debug") {
      const user = await getUser(userId)
      console.log("[v0] Debug command - userId:", userId)
      console.log("[v0] Debug command - user data:", user)

      // Get all users from Redis to see what's stored
      const allUsers = await redis.hgetall("users")
      console.log("[v0] Debug command - all users in Redis:", allUsers)

      await sendMessage(
        chatId,
        `🔍 <b>Debug Info</b>\n\n` +
          `<b>Your Telegram ID:</b> <code>${userId}</code>\n` +
          `<b>Wallet Found:</b> ${user ? "✅ Yes" : "❌ No"}\n` +
          `${user ? `<b>Wallet Address:</b> <code>${user.walletAddress}</code>` : ""}\n\n` +
          `Check the server logs for detailed information.`,
      )
      return NextResponse.json({ ok: true })
    }

    // Handle /exportkey command for direct private key export
    if (text === "/exportkey") {
      const user = await getUser(userId)

      if (!user || !user.encryptedPrivateKey) {
        await sendMessage(
          chatId,
          "⚠️ <b>No Custodial Wallet Found</b>\n\nThis feature is only available for wallets generated through the bot.",
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🔐 Connect Wallet",
                    callback_data: "connect_wallet",
                  },
                ],
              ],
            },
          },
        )
        return NextResponse.json({ ok: true })
      }

      try {
        // Decrypt the private key
        const privateKeyBytes = decryptPrivateKey(user.encryptedPrivateKey)
        const privateKeyBase58 = bs58.encode(privateKeyBytes)

        await sendMessage(
          chatId,
          `🔑 <b>Private Key Export</b>\n\n` +
            `⚠️ <b>SECURITY WARNING:</b>\n` +
            `Never share your private key with anyone. Anyone with this key has full control of your wallet.\n\n` +
            `<b>Your Private Key:</b>\n<code>${privateKeyBase58}</code>\n\n` +
            `<b>Wallet Address:</b>\n<code>${user.walletAddress}</code>\n\n` +
            `<i>You can import this key into wallets like Phantom or Solflare.</i>\n\n` +
            `🗑 <b>Delete this message after saving your key securely.</b>`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "← Back to Wallet",
                    callback_data: "wallet_menu",
                  },
                ],
              ],
            },
          },
        )
      } catch (error: any) {
        console.error("[v0] Error exporting private key:", error)
        await sendMessage(
          chatId,
          `❌ <b>Export Failed</b>\n\n${error.message || "Failed to decrypt private key"}\n\nPlease try regenerating your wallet.`,
        )
      }

      return NextResponse.json({ ok: true })
    }

    // Unknown command
    await sendMessage(chatId, "⚠️ Unknown command\n\nUse /help for available commands", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "📖 View Commands",
              callback_data: "show_help",
            },
          ],
        ],
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 })
  }
}
