import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { wallet } = await req.json();
    if (!wallet) return NextResponse.json({ ok: false }, { status: 400 });
    console.log("[wallet] connected:", wallet);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
