import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUpcomingEvents } from "@/lib/scraper/smoothcomp"

// Simple in-memory cache for upcoming events (3-hour TTL)
let upcomingCache: { events: unknown[]; cachedAt: number } | null = null
const TTL = 3 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    if (upcomingCache && Date.now() - upcomingCache.cachedAt < TTL) {
      return NextResponse.json({ events: upcomingCache.events })
    }

    const events = await getUpcomingEvents()
    upcomingCache = { events, cachedAt: Date.now() }

    return NextResponse.json({ events })
  } catch (err) {
    console.error("upcoming-events error:", err)
    return NextResponse.json({ error: "Failed to load upcoming events" }, { status: 500 })
  }
}
