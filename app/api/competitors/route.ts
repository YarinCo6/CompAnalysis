import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getCachedCompetitors, setCachedCompetitors } from "@/lib/db/cache"
import { getCompetitors } from "@/lib/scraper/smoothcomp"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get("eventId")
  const eventUrl = searchParams.get("eventUrl") || undefined

  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 })
  }

  try {
    // Try cache
    const cached = await getCachedCompetitors(eventId)
    if (cached) {
      const categories = [...new Set(cached.map((c) => c.category).filter(Boolean))]
      return NextResponse.json({ competitors: cached, categories })
    }

    // Scrape
    const competitors = await getCompetitors(eventId, eventUrl)

    // Save to cache
    if (competitors.length > 0) {
      await setCachedCompetitors(
        eventId,
        competitors.map((c) => ({
          name: c.name,
          category: c.category || "",
          team: c.team || "",
          matchHistory: []
        }))
      )
    }

    const categories = [...new Set(competitors.map((c) => c.category).filter(Boolean))]
    return NextResponse.json({ competitors, categories })
  } catch (err) {
    const msg = (err as Error).message
    if (msg === "PRIVATE_EVENT") {
      return NextResponse.json(
        { error: "This event is currently private on Smoothcomp." },
        { status: 403 }
      )
    }
    console.error("competitors error:", err)
    return NextResponse.json({ error: "Failed to load competitors" }, { status: 500 })
  }
}
