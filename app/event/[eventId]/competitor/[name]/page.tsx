"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2, Instagram, Youtube, Play, ExternalLink, AlertCircle, Trophy, Zap, Shield, TrendingUp } from "lucide-react"
import { Suspense } from "react"

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

const STYLE_CONFIG = {
  "submission-focused": { label: "Submission Hunter", icon: Zap, color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10 border-[#f59e0b]/20" },
  "points-based": { label: "Points Fighter", icon: Trophy, color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/10 border-[#3b82f6]/20" },
  defensive: { label: "Defensive Grinder", icon: Shield, color: "text-[#a0a0a0]", bg: "bg-[#222] border-[#2a2a2a]" },
  unknown: { label: "Unknown Style", icon: TrendingUp, color: "text-[#666]", bg: "bg-[#111] border-[#222]" }
}

function StatRing({ value, label, color }: { value: number | null; label: string; color: string }) {
  if (value === null) return null
  const pct = Math.round(value * 100)
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
          <circle cx="36" cy="36" r={r} fill="none" stroke="#1e1e1e" strokeWidth="6" />
          <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor"
            strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            className={color} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-[#f0f0f0]">
          {pct}%
        </span>
      </div>
      <span className="text-xs text-[#666] text-center leading-tight">{label}</span>
    </div>
  )
}

function ProfileContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = params.eventId as string
  const name = decodeURIComponent(params.name as string)

  // Read competitor context passed from event page
  const team = searchParams.get("team") || ""
  const category = searchParams.get("category") || ""

  const [profile, setProfile] = useState<CompetitorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!loading) return
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [loading])

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true)
      setError("")
      setElapsed(0)
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

  const hasData = profile && !loading && !error
  const hasInsufficientData = profile?.styleProfile?.summary === "Insufficient match data for analysis."
  const styleConf = STYLE_CONFIG[profile?.styleProfile?.dominantStyle || "unknown"]
  const StyleIcon = styleConf.icon

  const wins = profile?.matchHistory?.filter(m => m.result === "win").length ?? 0
  const losses = profile?.matchHistory?.filter(m => m.result === "loss").length ?? 0
  const total = profile?.matchHistory?.length ?? 0

  function goBack() {
    router.push(`/event/${eventId}?name=${searchParams.get("eventName") || ""}&location=${searchParams.get("location") || ""}&date=${searchParams.get("date") || ""}`)
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      <header className="border-b border-[#1e1e1e] bg-[#080808]/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={goBack}
            className="text-[#555] hover:text-[#f0f0f0] transition-colors p-1 -ml-1 rounded">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-base font-bold bg-gradient-to-r from-[#3b82f6] to-[#6366f1] bg-clip-text text-transparent">
            BJJ Scout
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#3b82f6]" />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-[#f0f0f0]">Building scouting report...</p>
              <p className="text-xs text-[#555]">
                Scraping match history from Smoothcomp
                {elapsed > 0 && ` (${elapsed}s)`}
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="text-sm text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg px-4 py-3">
            {error}
          </div>
        ) : hasData ? (
          <div className="space-y-4">
            {/* Athlete header */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-[#3b82f6] to-[#6366f1]" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {/* Avatar + name */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#6366f1] flex items-center justify-center shrink-0">
                        <span className="text-base font-bold text-white">
                          {name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join("")}
                        </span>
                      </div>
                      <div>
                        <h1 className="text-xl font-bold text-[#f0f0f0]">{name}</h1>
                        {team && <p className="text-sm text-[#888] mt-0.5">{team}</p>}
                      </div>
                    </div>
                    {category && (
                      <span className="inline-block text-xs text-[#666] bg-[#1a1a1a] border border-[#222] px-2 py-0.5 rounded-md">
                        {category}
                      </span>
                    )}
                  </div>

                  {/* Style badge */}
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium shrink-0 ${styleConf.bg} ${styleConf.color}`}>
                    <StyleIcon className="w-3.5 h-3.5" />
                    {styleConf.label}
                  </div>
                </div>

                {/* W/L record */}
                {total > 0 && (
                  <div className="mt-4 flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#22c55e]">{wins}</p>
                      <p className="text-xs text-[#555]">Wins</p>
                    </div>
                    <div className="text-[#333] text-2xl font-light">—</div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#ef4444]">{losses}</p>
                      <p className="text-xs text-[#555]">Losses</p>
                    </div>
                    <div className="text-[#333] text-2xl font-light">—</div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#888]">{total}</p>
                      <p className="text-xs text-[#555]">Total</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats rings */}
            {(profile.winRate !== null || profile.submissionRate !== null) && (
              <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
                <h2 className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-4">Match Analytics</h2>
                <div className="flex gap-8 justify-center">
                  <StatRing value={profile.winRate} label="Win Rate" color="text-[#22c55e]" />
                  <StatRing value={profile.submissionRate} label="Sub Rate" color="text-[#f59e0b]" />
                </div>
              </div>
            )}

            {/* AI Scouting Report */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
              <h2 className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-3">
                AI Scouting Report
              </h2>
              {hasInsufficientData ? (
                <div className="flex items-start gap-2 text-sm text-[#555]">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#444]" />
                  <span>Not enough recorded match data for analysis (minimum 3 matches required).</span>
                </div>
              ) : (
                <>
                  <p className="text-sm text-[#d0d0d0] leading-relaxed">{profile.styleProfile?.summary}</p>
                  {profile.styleProfile?.notablePatterns?.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {profile.styleProfile.notablePatterns.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#888]">
                          <span className="text-[#3b82f6] mt-0.5">›</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs text-[#444] mt-3 italic">Generated from public Smoothcomp match data.</p>
                </>
              )}
            </div>

            {/* Social / Videos */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5">
              <h2 className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-3">Find Online</h2>
              <div className="flex flex-wrap gap-2">
                {profile.notableVideoUrl && (
                  <a href={profile.notableVideoUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition-all">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Watch Match
                  </a>
                )}
                {profile.instagramUrl ? (
                  <a href={profile.instagramUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 border border-[#222] text-[#a0a0a0] px-3 py-1.5 rounded-lg text-xs hover:border-[#333] hover:text-[#f0f0f0] transition-all">
                    <Instagram className="w-3.5 h-3.5" /> Instagram
                  </a>
                ) : (
                  <a href={`https://www.instagram.com/explore/tags/${encodeURIComponent(name.replace(/\s/g, ""))}/`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 border border-[#1e1e1e] text-[#555] px-3 py-1.5 rounded-lg text-xs hover:border-[#333] hover:text-[#888] transition-all">
                    <Instagram className="w-3.5 h-3.5" /> Search Instagram <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {profile.youtubeUrl ? (
                  <a href={profile.youtubeUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 border border-[#222] text-[#a0a0a0] px-3 py-1.5 rounded-lg text-xs hover:border-[#333] hover:text-[#f0f0f0] transition-all">
                    <Youtube className="w-3.5 h-3.5" /> YouTube
                  </a>
                ) : (
                  <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(name + " BJJ")}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 border border-[#1e1e1e] text-[#555] px-3 py-1.5 rounded-lg text-xs hover:border-[#333] hover:text-[#888] transition-all">
                    <Youtube className="w-3.5 h-3.5" /> Search YouTube <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Match history */}
            {profile.matchHistory?.length > 0 && (
              <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#1e1e1e]">
                  <h2 className="text-xs font-semibold text-[#888] uppercase tracking-wider">
                    Match History
                    <span className="ml-2 text-[#444] normal-case tracking-normal font-normal">
                      {profile.matchHistory.length} matches
                    </span>
                  </h2>
                </div>
                <div className="divide-y divide-[#1a1a1a]">
                  {profile.matchHistory.map((match, idx) => (
                    <div key={idx} className="px-5 py-3 flex items-center gap-3">
                      <span className={`text-xs font-bold uppercase w-8 shrink-0 ${
                        match.result === "win" ? "text-[#22c55e]"
                        : match.result === "loss" ? "text-[#ef4444]"
                        : "text-[#666]"
                      }`}>
                        {match.result === "win" ? "W" : match.result === "loss" ? "L" : "D"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#f0f0f0] truncate font-medium">{match.opponent}</p>
                        <p className="text-xs text-[#666] truncate">
                          {match.method && (
                            <span className={match.method.toLowerCase().includes("sub") ? "text-[#f59e0b]" : ""}>
                              {match.method}
                            </span>
                          )}
                          {match.event && <span className="ml-1 text-[#444]">· {match.event}</span>}
                        </p>
                      </div>
                      {match.date && <span className="text-xs text-[#444] shrink-0">{match.date}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  )
}

export default function CompetitorProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#3b82f6]" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  )
}
