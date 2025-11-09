import { type NextRequest, NextResponse } from "next/server"
import { generateLinkCode } from "@/lib/storage/users"

export async function POST(req: NextRequest) {
  try {
    const { wallet } = await req.json()

    if (!wallet) {
      return NextResponse.json({ success: false, error: "Missing wallet address" }, { status: 400 })
    }

    const code = await generateLinkCode(wallet)

    return NextResponse.json({ success: true, code })
  } catch (error: any) {
    console.error("[v0] Error generating link code:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
