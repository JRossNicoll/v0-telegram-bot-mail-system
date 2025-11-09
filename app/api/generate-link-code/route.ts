import { type NextRequest, NextResponse } from "next/server"
import { generateLinkCode } from "@/lib/storage/users"

export async function POST(req: NextRequest) {
  try {
    console.log("[v0] 🔗 Generate link code request received")

    const { wallet } = await req.json()

    if (!wallet) {
      console.error("[v0] ❌ Missing wallet address in request")
      return NextResponse.json({ success: false, error: "Missing wallet address" }, { status: 400 })
    }

    console.log("[v0] 🔗 Generating link code for wallet:", wallet.substring(0, 8) + "...")

    const code = await generateLinkCode(wallet)

    console.log("[v0] ✅ Successfully generated link code:", code)

    return NextResponse.json({ success: true, code })
  } catch (error: any) {
    console.error("[v0] ❌ Error generating link code:", error.message)
    console.error("[v0] Stack:", error.stack)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
