export interface SocialLinks {
  instagramUrl: string | null
  youtubeUrl: string | null
  notableVideoUrl: string | null
}

interface GoogleSearchItem {
  link: string
  title: string
  snippet?: string
}

interface GoogleSearchResponse {
  items?: GoogleSearchItem[]
}

export async function searchSocialLinks(competitorName: string): Promise<SocialLinks> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY
  const cseId = process.env.GOOGLE_CSE_ID

  if (!apiKey || !cseId) {
    // No API key — return null links (UI will show fallback search buttons)
    return { instagramUrl: null, youtubeUrl: null, notableVideoUrl: null }
  }

  const query = `${competitorName} BJJ grappling`
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query)}&num=10`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.error("Google CSE error:", res.status)
      return { instagramUrl: null, youtubeUrl: null, notableVideoUrl: null }
    }

    const data: GoogleSearchResponse = await res.json()
    const items = data.items || []

    let instagramUrl: string | null = null
    let youtubeUrl: string | null = null
    let notableVideoUrl: string | null = null

    for (const item of items) {
      const link = item.link || ""

      if (!instagramUrl && link.includes("instagram.com/") && !link.includes("/p/") && !link.includes("/reel/")) {
        instagramUrl = link
      }

      if (!youtubeUrl && (link.includes("youtube.com/@") || link.includes("youtube.com/channel/") || link.includes("youtube.com/user/"))) {
        youtubeUrl = link
      }

      if (!notableVideoUrl && link.includes("youtube.com/watch?v=")) {
        // Prefer competition-related videos
        const text = [item.title, item.snippet || ""].join(" ").toLowerCase()
        const isCompetition = ["competition", "match", "fight", "vs", "bjj", "tournament", "grappling"].some(
          (kw) => text.includes(kw)
        )
        if (isCompetition) notableVideoUrl = link
      }

      if (instagramUrl && youtubeUrl && notableVideoUrl) break
    }

    // If we found a YouTube channel but no video, pick first YouTube video
    if (!notableVideoUrl) {
      const videoItem = items.find((i) => i.link?.includes("youtube.com/watch?v="))
      if (videoItem) notableVideoUrl = videoItem.link
    }

    return { instagramUrl, youtubeUrl, notableVideoUrl }
  } catch (err) {
    console.error("socialSearch error:", err)
    return { instagramUrl: null, youtubeUrl: null, notableVideoUrl: null }
  }
}
