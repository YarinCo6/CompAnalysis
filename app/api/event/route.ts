import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getCachedEvent } from "@/lib/db/cache"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  try {
    const cached = await getCachedEvent(id)
    if (!cached) {
      return NextResponse.json({ event: null })
    }
    return NextResponse.json({
      event: {
        id: cached.smoothcompId,
        name: cached.name,
        date: cached.date,
        org: cached.org,
        location: cached.location
      }
    })
  } catch (err) {
    console.error("event lookup error:", err)
    return NextResponse.json({ error: "Failed to load event" }, { status: 500 })
  }
}
