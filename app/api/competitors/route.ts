import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getCachedCompetitors, setCachedCompetitors, prisma } from "@/lib/db/cache"
import { getCompetitors, Competitor } from "@/lib/scraper/smoothcomp"

/** Batch-check which competitor names have a cached analytics profile */
async function getAnalysisSet(names: string[]): Promise<Set<string>> {
  if (names.length === 0) return new Set()
  const profiles = await prisma.profileCache.findMany({
    where: { competitorName: { in: names } },
    select: { competitorName: true }
  })
  return new Set(profiles.map((p) => p.competitorName))
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get("eventId")
  const eventUrl = searchParams.get("eventUrl") || undefined

  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 })
  }

  const forceRefresh = searchParams.get("refresh") === "1"

  try {
    let competitors: Competitor[]

    // Try cache (skip if ?refresh=1)
    if (!forceRefresh) {
      const cached = await getCachedCompetitors(eventId)
      if (cached && cached.length > 0) {
        competitors = cached
      } else {
        competitors = await getCompetitors(eventId, eventUrl)
        if (competitors.length > 0) {
          await setCachedCompetitors(
            eventId,
            competitors.map((c) => ({
              name: c.name,
              category: c.category || "",
              team: c.team || "",
              profileUrl: c.profileUrl || "",
              matchHistory: []
            }))
          )
        }
      }
    } else {
      competitors = await getCompetitors(eventId, eventUrl)
      if (competitors.length > 0) {
        await setCachedCompetitors(
          eventId,
          competitors.map((c) => ({
            name: c.name,
            category: c.category || "",
            team: c.team || "",
            profileUrl: c.profileUrl || "",
            matchHistory: []
          }))
        )
      }
    }

    // Batch-check which competitors have a cached analytics profile
    const analysisSet = await getAnalysisSet(competitors.map((c) => c.name))

    const withAnalysis = competitors.map((c) => ({
      ...c,
      hasAnalysis: analysisSet.has(c.name)
    }))

    const categories = Array.from(
      new Set(withAnalysis.map((c) => c.category).filter(Boolean))
    )

    return NextResponse.json({ competitors: withAnalysis, categories })
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
