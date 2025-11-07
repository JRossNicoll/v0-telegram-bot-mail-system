import { NextResponse } from "next/server";
import { getMessagesForWallet } from "@/lib/storage/messages";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const wallet = url.searchParams.get("wallet");
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });
  const msgs = await getMessagesForWallet(wallet);
  return NextResponse.json({ messages: msgs });
}
