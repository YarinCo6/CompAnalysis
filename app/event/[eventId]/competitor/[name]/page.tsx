"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Instagram, Youtube, Play, ExternalLink, AlertCircle } from "lucide-react"
import { ProfileAnalytics } from "@/components/ProfileAnalytics"

interface MatchResult {
  opponent: string
  result: "win" | "loss" | "draw"
  method: string
  submissionType?: string
  event: string
  date?: string
  time?: string
}

interface StyleProfile {
  summary: string
  submissionRate: number | null
  winRate: number | null
  dominantStyle: "submission-focused" | "points-based" | "defensive" | "unknown"
  notablePatterns: string[]
}

interface CompetitorProfile {
  competitorName: string
  instagramUrl: string | null
  youtubeUrl: string | null
  notableVideoUrl: string | null
  styleProfile: StyleProfile
  submissionRate: number | null
  winRate: number | null
  matchHistory: MatchResult[]
}

export default function CompetitorProfilePage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string
  const name = decodeURIComponent(params.name as string)

  const [profile, setProfile] = useState<CompetitorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true)
      setError("")
      try {
        const res = await fetch(
          `/api/competitor-profile?name=${encodeURIComponent(name)}&eventId=${eventId}`
        )
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to load profile")
        setProfile(data.profile)
      } catch (err) {
        setError((err as Error).message || "Failed to load competitor profile")
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [name, eventId])

  const hasInsufficientData =
    profile?.styleProfile?.summary === "Insufficient match data for analysis."

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-[#2a2a2a] bg-[#0a0a0a] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push(`/event/${eventId}`)}
            className="text-[#a0a0a0] hover:text-[#f0f0f0] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-lg font-semibold text-[#f0f0f0]">BJJ Scout</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#666]" />
          </div>
        ) : error ? (
          <div className="text-sm text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-md px-4 py-3">
            {error}
          </div>
        ) : profile ? (
          <div className="space-y-5">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-semibold text-[#f0f0f0]">{name}</h1>
              <p className="text-sm text-[#666] mt-0.5">Event {eventId}</p>
            </div>

            {/* Social Links */}
            {(profile.instagramUrl || profile.youtubeUrl || profile.notableVideoUrl ||
              !profile.instagramUrl || !profile.youtubeUrl) && (
              <div className="flex flex-wrap gap-2">
                {profile.instagramUrl ? (
                  <a
                    href={profile.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 border border-[#2a2a2a] text-[#a0a0a0] px-3 py-1.5 rounded-md hover:border-[#444] transition-colors text-xs"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    Instagram
                  </a>
                ) : (
                  <a
                    href={`https://www.instagram.com/explore/tags/${encodeURIComponent(name.replace(/\s/g, ""))}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 border border-[#2a2a2a] text-[#666] px-3 py-1.5 rounded-md hover:border-[#333] transition-colors text-xs"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    Search Instagram
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {profile.youtubeUrl ? (
                  <a
                    href={profile.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 border border-[#2a2a2a] text-[#a0a0a0] px-3 py-1.5 rounded-md hover:border-[#444] transition-colors text-xs"
                  >
                    <Youtube className="w-3.5 h-3.5" />
                    YouTube
                  </a>
                ) : (
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(name + " BJJ")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 border border-[#2a2a2a] text-[#666] px-3 py-1.5 rounded-md hover:border-[#333] transition-colors text-xs"
                  >
                    <Youtube className="w-3.5 h-3.5" />
                    Search YouTube
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {profile.notableVideoUrl && (
                  <a
                    href={profile.notableVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-[#222] text-[#f59e0b] px-3 py-1.5 rounded-md hover:bg-[#2a2a2a] transition-colors text-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Watch Notable Match
                  </a>
                )}
              </div>
            )}

            {/* Analytics */}
            <ProfileAnalytics
              winRate={profile.winRate}
              submissionRate={profile.submissionRate}
              dominantStyle={profile.styleProfile?.dominantStyle || "unknown"}
            />

            {/* AI Scouting Report */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md p-4">
              <h2 className="text-xs uppercase tracking-wider font-medium text-[#a0a0a0] mb-3">
                AI Scouting Report
              </h2>

              {hasInsufficientData ? (
                <div className="flex items-start gap-2 text-sm text-[#666]">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Insufficient match data for analysis. Less than 3 recorded matches found.</span>
                </div>
              ) : (
                <>
                  <p className="text-sm text-[#f0f0f0] leading-relaxed">
                    {profile.styleProfile?.summary}
                  </p>
                  <p className="text-xs text-[#666] mt-3 italic">
                    Generated from available public match data. May be incomplete.
                  </p>
                </>
              )}
            </div>

            {/* Notable Patterns */}
            {!hasInsufficientData &&
              profile.styleProfile?.notablePatterns?.length > 0 && (
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md p-4">
                  <h2 className="text-xs uppercase tracking-wider font-medium text-[#a0a0a0] mb-3">
                    Notable Patterns
                    <span className="ml-2 text-[#666] normal-case tracking-normal">
                      — Based on available match data
                    </span>
                  </h2>
                  <ul className="space-y-1.5">
                    {profile.styleProfile.notablePatterns.map((pattern, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-[#f0f0f0]">
                        <span className="text-[#666] mt-0.5">•</span>
                        {pattern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Match History */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md p-4">
              <h2 className="text-xs uppercase tracking-wider font-medium text-[#a0a0a0] mb-3">
                Match History
              </h2>

              {!profile.matchHistory || profile.matchHistory.length === 0 ? (
                <p className="text-sm text-[#666]">No match history available.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-[#666] uppercase tracking-wider border-b border-[#2a2a2a]">
                        <th className="text-left pb-2 pr-4">Result</th>
                        <th className="text-left pb-2 pr-4">Opponent</th>
                        <th className="text-left pb-2 pr-4">Method</th>
                        <th className="text-left pb-2 pr-4">Event</th>
                        <th className="text-left pb-2">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e1e1e]">
                      {profile.matchHistory.map((match, idx) => (
                        <tr key={idx} className="text-[#f0f0f0]">
                          <td className="py-2 pr-4">
                            <span
                              className={`text-xs font-medium uppercase tracking-wider ${
                                match.result === "win"
                                  ? "text-[#22c55e]"
                                  : match.result === "loss"
                                  ? "text-[#ef4444]"
                                  : "text-[#666]"
                              }`}
                            >
                              {match.result}
                            </span>
                          </td>
                          <td className="py-2 pr-4 text-[#f0f0f0]">{match.opponent}</td>
                          <td className="py-2 pr-4 text-[#a0a0a0]">
                            {match.method && match.method.toLowerCase().includes("sub") ? (
                              <span className="text-[#f59e0b]">{match.method}</span>
                            ) : (
                              match.method || "—"
                            )}
                          </td>
                          <td className="py-2 pr-4 text-[#666] text-xs">{match.event || "—"}</td>
                          <td className="py-2 text-[#666] text-xs">{match.date || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
