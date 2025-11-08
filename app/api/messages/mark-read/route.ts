import { NextResponse } from "next/server";
import { markRead } from "@/lib/storage/messages";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { wallet, id } = await req.json();
  if (!wallet || !id) return NextResponse.json({ ok: false }, { status: 400 });
  const changed = await markRead(wallet, id);
  return NextResponse.json({ ok: changed });
}
