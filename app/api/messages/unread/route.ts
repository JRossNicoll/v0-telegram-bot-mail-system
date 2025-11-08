import { NextResponse } from "next/server";
import { getUnreadCount } from "@/lib/storage/messages";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const wallet = url.searchParams.get("wallet");
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });
  const count = await getUnreadCount(wallet);
  return NextResponse.json({ unread: count });
}
