#!/usr/bin/env bash

echo "🔧 Applying automated fixes..."

# Ensure prisma folder + schema exists
mkdir -p prisma

if [ ! -f prisma/schema.prisma ]; then
cat << 'EOF' > prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                 String   @id @default(uuid())
  wallet             String   @unique
  telegramId         String?
  encryptedPrivKey   String?
  createdAt          DateTime @default(now())
  messages           Message[]
}

model Message {
  id        String   @id @default(uuid())
  from      String
  to        String
  message   String
  signature String?
  isOnchain Boolean  @default(false)
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User?    @relation(fields: [from], references: [wallet])
}
EOF
fi

# Generate Prisma client
npx prisma generate || echo "⚠️ Prisma not generated (DB env might be missing)"

# Create type for crypto-js if missing
mkdir -p types
echo "declare module 'crypto-js';" > types/crypto-js.d.ts

# Ensure necessary solana & privy packages exist
pnpm add @solana/web3.js @solana/wallet-adapter-react @solana/wallet-adapter-phantom \
        @privy-io/react-auth @privy-io/server-core bs58 crypto-js

echo "✅ Fixes applied!"

