import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { searchCachedEvents, setCachedEvent } from "@/lib/db/cache"
import { searchEvents } from "@/lib/scraper/smoothcomp"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { query } = await req.json()
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "query is required" }, { status: 400 })
    }

    // Try cache first
    const cached = await searchCachedEvents(query)
    if (cached.length > 0) {
      return NextResponse.json({ events: cached.map((e) => ({ ...e, data: undefined })) })
    }

    // Scrape Smoothcomp
    const events = await searchEvents(query)

    // Save to cache
    await Promise.all(
      events.map((e) =>
        setCachedEvent({
          smoothcompId: e.id,
          name: e.name,
          date: e.date,
          org: e.org,
          location: e.location,
          data: e
        })
      )
    )

    return NextResponse.json({ events })
  } catch (err) {
    console.error("search-event error:", err)
    return NextResponse.json({ error: "Failed to search events" }, { status: 500 })
  }
}
