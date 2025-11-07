import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const BASE_URL = process.env.PUBLIC_BASE_URL; // e.g. https://your-app.vercel.app
  const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || "";

  if (!BOT_TOKEN || !BASE_URL) {
    return NextResponse.json({ ok: false, error: "Missing env" }, { status: 400 });
  }

  const api = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;
  const url = `${BASE_URL}/api/telegram/webhook${SECRET ? `?secret=${SECRET}` : ""}`;

  const res = await fetch(api, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })
  });

  const data = await res.json();
  return NextResponse.json(data);
}
