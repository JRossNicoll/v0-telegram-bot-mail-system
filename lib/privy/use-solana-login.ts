"use client";

import { useWallets, useLoginWithSiws } from "@privy-io/react-auth";

export const useSolanaLogin = () => {
  const { wallets } = useWallets();
  const { generateSiwsMessage, loginWithSiws } = useLoginWithSiws();

  const login = async () => {
    const w = wallets[0];
    if (!w || w.chain !== "solana") return;

    const message = await generateSiwsMessage({
      address: w.address,
      chainId: `solana:${w.chainId}`,
    });

    const signature = await w.sign(message);
    return loginWithSiws({ message, signature });
  };

  return { login };
};
