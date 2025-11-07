import { NextResponse } from "next/server";
import { requireTelegramSecret, sendTelegramMessage } from "@/lib/telegram/api";
import { connectWallet, getWalletByTelegramId } from "@/lib/storage/users";
import { saveMessage } from "@/lib/storage/messages";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    if (!requireTelegramSecret(url.searchParams)) {
      return NextResponse.json({ ok: false, error: "bad secret" }, { status: 403 });
    }

    const update = await req.json();
    const msg = update?.message;
    if (!msg) return NextResponse.json({ ok: true });

    const chatId: number = msg.chat?.id;
    const text: string = msg.text ?? "";

    // Commands:
    if (text.startsWith("/start")) {
      await sendTelegramMessage(chatId, "Welcome to Courier Mail.\nUse /connect <WALLET_ADDRESS> to link your wallet.");
      return NextResponse.json({ ok: true });
    }

    if (text.startsWith("/connect")) {
      const parts = text.split(/\s+/);
      const wallet = parts[1];
      if (!wallet) {
        await sendTelegramMessage(chatId, "Usage: /connect <WALLET_ADDRESS>");
      } else {
        await connectWallet(chatId, wallet);
        await sendTelegramMessage(chatId, `Linked ✅ to wallet: ${wallet}`);
      }
      return NextResponse.json({ ok: true });
    }

    // If user is linked, any plain message they send becomes a “self-note” to their wallet inbox
    const linkedWallet = await getWalletByTelegramId(chatId);
    if (linkedWallet) {
      await saveMessage("telegram", linkedWallet, text, undefined, false);
      await sendTelegramMessage(chatId, "Saved to your wallet inbox ✅");
    } else {
      await sendTelegramMessage(chatId, "No wallet linked. Use /connect <WALLET_ADDRESS>.");
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[telegram webhook]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
