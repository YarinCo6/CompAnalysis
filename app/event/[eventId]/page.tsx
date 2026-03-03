"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft, Loader2, Shield, ChevronRight, Users, MapPin,
  Calendar, Search, X, ExternalLink, ArrowUpDown
} from "lucide-react"
import { FilterBar } from "@/components/FilterBar"
import { CompetitorCard } from "@/components/CompetitorCard"
import { RulesetModal } from "@/components/RulesetModal"

interface Competitor {
  name: string
  team: string
  category: string
  weight?: string
  belt?: string
  hasAnalysis?: boolean
  profileUrl?: string
}

interface EventData {
  id: string
  name: string
  date: string
  org: string
  location: string
}

const PAGE_SIZE = 50
type SortKey = "name" | "team" | "category"

function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch { return dateStr }
}

// Loading messages that cycle while Playwright scrapes
const LOADING_MSGS = [
  "Connecting to Smoothcomp...",
  "Scrolling through all categories...",
  "Loading participant groups...",
  "Almost there...",
]

function EventPageContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = params.eventId as string

  const [event] = useState<EventData>({
    id: eventId,
    name: searchParams.get("name") || `Event ${eventId}`,
    date: searchParams.get("date") || "",
    org: searchParams.get("org") || "",
    location: searchParams.get("location") || ""
  })

  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [nameSearch, setNameSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortAsc, setSortAsc] = useState(true)
  const [page, setPage] = useState(1)
  const [showRuleset, setShowRuleset] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const nameSearchRef = useRef<HTMLInputElement>(null)

  // Elapsed timer + cycling messages while loading
  useEffect(() => {
    if (!loading) return
    const timer = setInterval(() => {
      setElapsed(e => e + 1)
      setLoadingMsgIdx(i => (i + 1) % LOADING_MSGS.length)
    }, 2500)
    return () => clearInterval(timer)
  }, [loading])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError("")
      setElapsed(0)
      try {
        const compRes = await fetch(`/api/competitors?eventId=${eventId}`)
        const compData = await compRes.json()
        if (!compRes.ok) throw new Error(compData.error || "Failed to load competitors")
        setCompetitors(compData.competitors || [])
        setCategories(compData.categories || [])
      } catch (err) {
        setError((err as Error).message || "Failed to load event data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [eventId])

  // Filter by category + name search
  const afterCategoryFilter = selectedCategory
    ? competitors.filter(c => c.category === selectedCategory)
    : competitors

  const afterNameFilter = nameSearch.trim()
    ? afterCategoryFilter.filter(c =>
        c.name.toLowerCase().includes(nameSearch.toLowerCase()) ||
        c.team.toLowerCase().includes(nameSearch.toLowerCase())
      )
    : afterCategoryFilter

  // Sort
  const sorted = [...afterNameFilter].sort((a, b) => {
    const av = (a[sortKey] || "").toLowerCase()
    const bv = (b[sortKey] || "").toLowerCase()
    return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av)
  })

  const paginated = sorted.slice(0, page * PAGE_SIZE)
  const hasMore = paginated.length < sorted.length

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(true) }
    setPage(1)
  }

  const smoothcompUrl = `https://smoothcomp.com/en/event/${eventId}/participants`

  return (
    <div className="min-h-screen bg-[#080808]">
      <header className="border-b border-[#1e1e1e] bg-[#080808]/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.push("/")}
            className="text-[#555] hover:text-[#f0f0f0] transition-colors p-1 -ml-1 rounded">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-base font-bold bg-gradient-to-r from-[#3b82f6] to-[#6366f1] bg-clip-text text-transparent">
            BJJ Scout
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="relative">
              <Loader2 className="w-10 h-10 animate-spin text-[#3b82f6]" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-[#f0f0f0]">{LOADING_MSGS[loadingMsgIdx]}</p>
              <p className="text-xs text-[#555]">
                Live scraping from Smoothcomp — takes ~30 seconds
                {elapsed > 0 && ` (${elapsed}s)`}
              </p>
            </div>
            <div className="flex gap-1.5 mt-1">
              {LOADING_MSGS.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                  i === loadingMsgIdx ? "bg-[#3b82f6] scale-125" : "bg-[#2a2a2a]"
                }`} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-sm text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg px-4 py-3">
            {error}
          </div>
        ) : (
          <>
            {/* Event header */}
            <div className="mb-5 bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-[#3b82f6] to-[#6366f1]" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-[#f0f0f0] leading-snug">{event.name}</h1>
                    {event.org && (
                      <p className="text-sm font-semibold bg-gradient-to-r from-[#3b82f6] to-[#6366f1] bg-clip-text text-transparent mt-1">
                        {event.org}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-3">
                      {event.date && (
                        <div className="flex items-center gap-1.5 text-xs text-[#888]">
                          <Calendar className="w-3.5 h-3.5 text-[#555]" />
                          {formatDate(event.date)}
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1.5 text-xs text-[#888]">
                          <MapPin className="w-3.5 h-3.5 text-[#555]" />
                          {event.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-[#888]">
                        <Users className="w-3.5 h-3.5 text-[#555]" />
                        {competitors.length} competitors · {categories.length} categories
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <a href={smoothcompUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 border border-[#222] text-[#666] px-3 py-1.5 rounded-lg hover:border-[#3b82f6]/50 hover:text-[#3b82f6] transition-all text-xs">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Smoothcomp
                    </a>
                    {event.org && (
                      <button onClick={() => setShowRuleset(true)}
                        className="flex items-center gap-1.5 border border-[#222] text-[#666] px-3 py-1.5 rounded-lg hover:border-[#3b82f6]/50 hover:text-[#3b82f6] transition-all text-xs">
                        <Shield className="w-3.5 h-3.5" />
                        Ruleset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Category filter dropdown */}
            {categories.length > 0 && (
              <FilterBar
                categories={categories}
                selected={selectedCategory}
                totalCount={competitors.length}
                filteredCount={afterCategoryFilter.length}
                onSelect={(cat) => { setSelectedCategory(cat); setPage(1) }}
              />
            )}

            {/* Name search + Sort bar */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#555]" />
                <input
                  ref={nameSearchRef}
                  type="text"
                  value={nameSearch}
                  onChange={e => { setNameSearch(e.target.value); setPage(1) }}
                  placeholder="Search by name or team..."
                  className="w-full bg-[#111] border border-[#222] rounded-lg pl-9 pr-8 py-2 text-sm text-[#f0f0f0] placeholder-[#555] outline-none focus:border-[#3b82f6]/50 transition-all"
                />
                {nameSearch && (
                  <button onClick={() => { setNameSearch(""); setPage(1); nameSearchRef.current?.focus() }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#888]">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sort controls */}
              <div className="flex gap-1">
                {(["name", "team", "category"] as SortKey[]).map(key => (
                  <button key={key} onClick={() => toggleSort(key)}
                    className={`flex items-center gap-1 px-2.5 py-2 rounded-lg border text-xs transition-all ${
                      sortKey === key
                        ? "border-[#3b82f6]/50 bg-[#3b82f6]/10 text-[#3b82f6]"
                        : "border-[#222] text-[#555] hover:border-[#333] hover:text-[#888]"
                    }`}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                    {sortKey === key && (
                      <ArrowUpDown className={`w-3 h-3 ${sortAsc ? "" : "rotate-180"}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Results count */}
            {(nameSearch || selectedCategory) && (
              <p className="text-xs text-[#555] mb-3">
                Showing {sorted.length} of {competitors.length} competitors
              </p>
            )}

            {/* Competitor list */}
            {paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Users className="w-8 h-8 text-[#333]" />
                <p className="text-sm text-[#555]">No competitors found.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {paginated.map((competitor, idx) => (
                  <CompetitorCard
                    key={`${competitor.name}-${idx}`}
                    competitor={competitor}
                    onClick={() => router.push(
                      `/event/${eventId}/competitor/${encodeURIComponent(competitor.name)}` +
                      `?team=${encodeURIComponent(competitor.team || "")}` +
                      `&category=${encodeURIComponent(competitor.category || "")}` +
                      `&eventName=${encodeURIComponent(event.name)}` +
                      `&location=${encodeURIComponent(event.location || "")}` +
                      `&date=${encodeURIComponent(event.date || "")}`
                    )}
                  />
                ))}
              </div>
            )}

            {hasMore && (
              <div className="mt-5 flex justify-center">
                <button onClick={() => setPage(p => p + 1)}
                  className="border border-[#222] text-[#888] px-5 py-2 rounded-lg hover:border-[#3b82f6]/50 hover:text-[#3b82f6] transition-all text-sm flex items-center gap-2">
                  Load more <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {showRuleset && event.org && (
        <RulesetModal org={event.org} onClose={() => setShowRuleset(false)} />
      )}
    </div>
  )
}

export default function EventPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#3b82f6]" />
      </div>
    }>
      <EventPageContent />
    </Suspense>
  )
}
