import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getCachedProfile, setCachedProfile, getCachedCompetitors } from "@/lib/db/cache"
import { getMatchHistory } from "@/lib/scraper/smoothcomp"
import { searchSocialLinks } from "@/lib/enrichment/socialSearch"
import { generateAIProfile } from "@/lib/enrichment/aiProfile"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const name = searchParams.get("name")
  const eventId = searchParams.get("eventId")

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }

  try {
    // Try cache
    const cached = await getCachedProfile(name)
    if (cached) {
      return NextResponse.json({
        profile: {
          ...cached,
          styleProfile: JSON.parse(cached.styleProfile)
        }
      })
    }

    // Find competitor's profile URL from competitor cache
    let profileUrl: string | undefined
    if (eventId) {
      const competitors = await getCachedCompetitors(eventId)
      const competitor = competitors?.find(
        (c) => c.name.toLowerCase() === name.toLowerCase()
      )
      // matchHistory stored as JSON — may contain profileUrl if we stored it
      const mh = competitor?.matchHistory as { profileUrl?: string } | null
      profileUrl = mh?.profileUrl
    }

    // Fetch match history
    const matchHistory = profileUrl ? await getMatchHistory(profileUrl) : []

    // Social search + AI profile in parallel
    const [social, aiProfile] = await Promise.all([
      searchSocialLinks(name),
      generateAIProfile(name, matchHistory)
    ])

    const styleProfile = JSON.stringify(aiProfile)

    // Save to cache
    await setCachedProfile({
      competitorName: name,
      instagramUrl: social.instagramUrl,
      youtubeUrl: social.youtubeUrl,
      notableVideoUrl: social.notableVideoUrl,
      styleProfile,
      submissionRate: aiProfile.submissionRate,
      winRate: aiProfile.winRate
    })

    return NextResponse.json({
      profile: {
        competitorName: name,
        instagramUrl: social.instagramUrl,
        youtubeUrl: social.youtubeUrl,
        notableVideoUrl: social.notableVideoUrl,
        styleProfile: aiProfile,
        submissionRate: aiProfile.submissionRate,
        winRate: aiProfile.winRate,
        matchHistory
      }
    })
  } catch (err) {
    console.error("competitor-profile error:", err)
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 })
  }
}
