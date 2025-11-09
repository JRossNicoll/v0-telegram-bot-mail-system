# Courier Messaging System Guide

## Overview
Courier is a decentralized messaging system that connects Solana wallets with Telegram, enabling both on-chain and off-chain messaging.

## System Architecture

### 1. **On-Chain Messaging** (Blockchain)
- Messages are permanently stored on the Solana blockchain
- Each message creates a real Solana transaction
- Sends 0.000001 SOL (1000 lamports) to the recipient
- Message content is stored in the transaction memo field
- Verifiable on Solscan blockchain explorer
- Cost: ~0.00001 SOL per message (~$0.002)

### 2. **Off-Chain Messaging** (Database)
- Messages stored in Redis database
- Instant delivery with no transaction fees
- Private and not publicly verifiable
- Real-time notifications via Telegram
- Cost: Free

## User Flows

### Web App Flow
1. User connects Phantom wallet on `/` (login page)
2. Redirected to `/inbox` (inbox page)
3. Can send on-chain or off-chain messages
4. Optional: Link Telegram account for notifications

### Telegram Bot Flow
1. User sends `/start` to bot
2. Click "Get Started" to connect wallet
3. Opens mini app to connect Phantom wallet
4. Generate 6-digit link code
5. Send `/link <code>` in Telegram to complete linking
6. Can now use both web and Telegram bot

### Linking Process
1. **Web → Telegram**: 
   - Connect wallet on web
   - Click "Link Telegram" in inbox
   - Get 6-digit code
   - Send `/link <code>` to bot

2. **Telegram → Web**:
   - Start bot and click "Get Started"
   - Opens mini app at `/miniapp`
   - Connect Phantom wallet
   - Generate and send link code

## API Endpoints

### Messaging
- `POST /api/send-message` - Send off-chain message
- `POST /api/send-onchain` - Send on-chain message
- `GET /api/messages` - Get inbox messages

### Linking
- `POST /api/generate-link-code` - Generate 6-digit code
- `POST /api/check-telegram-link` - Check if wallet is linked
- `POST /api/webhook` - Telegram bot webhook (handles `/link` command)

### Testing
- `GET /api/test-messaging` - Check system status

## Environment Variables Required

\`\`\`env
# Redis (Upstash)
KV_REST_API_URL=your_redis_url
KV_REST_API_TOKEN=your_redis_token

# Solana
NEXT_PUBLIC_SOLANA_RPC=your_solana_rpc_url

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
NEXT_PUBLIC_APP_URL=your_app_url

# Encryption (for custodial wallets)
ENCRYPTION_KEY=your_32_byte_key
\`\`\`

## Key Features

### Security
- Row-level security for wallet data
- Encrypted private keys for custodial wallets
- Telegram ID verification for linking

### Notifications
- Telegram notifications for new messages
- Shows sender wallet address
- Includes message content and type (on-chain/off-chain)
- Direct link to Solscan for on-chain messages

### User Experience
- Clean VisionOS-inspired UI
- Mobile-optimized interface
- Real-time message updates (30s polling)
- Toast notifications for actions
- Responsive design

## Testing Checklist

- [ ] Web wallet connection (Phantom)
- [ ] On-chain message sending
- [ ] Off-chain message sending
- [ ] Message appears in recipient inbox
- [ ] Telegram bot `/start` command
- [ ] Mini app wallet connection
- [ ] Link code generation
- [ ] `/link` command in Telegram
- [ ] Telegram notifications for new messages
- [ ] Solscan link verification
- [ ] Mobile responsiveness

## Common Issues

### "Redis env not set"
- Ensure `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set in Vars
- Check Upstash for Redis integration is connected

### "Failed to send: Redis error"
- Check Redis connection with `/api/test-messaging`
- Verify environment variables are correct
- Check Upstash Redis instance is active

### "Wallet not linked to Telegram"
- On-chain messages require Telegram linking
- Use mini app to generate link code
- Send `/link <code>` to complete linking

### Link code not working
- Codes expire after 10 minutes
- Generate a new code if expired
- Ensure code is exactly 6 digits
- Check format: `/link 123456`

## Support
For issues, check server logs with `console.log("[v0] ...")` debugging statements throughout the codebase.
