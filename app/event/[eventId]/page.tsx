"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Shield, ChevronRight } from "lucide-react"
import { FilterBar } from "@/components/FilterBar"
import { CompetitorCard } from "@/components/CompetitorCard"
import { RulesetModal } from "@/components/RulesetModal"

interface Competitor {
  name: string
  team: string
  category: string
  weight?: string
  belt?: string
}

interface EventData {
  id: string
  name: string
  date: string
  org: string
  location: string
}

const PAGE_SIZE = 50

export default function EventPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<EventData | null>(null)
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [page, setPage] = useState(1)
  const [showRuleset, setShowRuleset] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError("")

      try {
        // Load event info and competitors in parallel
        const [eventRes, compRes] = await Promise.all([
          fetch(`/api/event?id=${eventId}`),
          fetch(`/api/competitors?eventId=${eventId}`)
        ])

        const compData = await compRes.json()
        if (!compRes.ok) {
          throw new Error(compData.error || "Failed to load competitors")
        }

        setCompetitors(compData.competitors || [])
        setCategories(compData.categories || [])

        // Set event info from cache
        const eventData = eventRes.ok ? (await eventRes.json()).event : null
        setEvent({
          id: eventId,
          name: eventData?.name || `Event ${eventId}`,
          date: eventData?.date || "",
          org: eventData?.org || "",
          location: eventData?.location || ""
        })
      } catch (err) {
        setError((err as Error).message || "Failed to load event data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [eventId])

  const filteredCompetitors = selectedCategory
    ? competitors.filter((c) => c.category === selectedCategory)
    : competitors

  const paginatedCompetitors = filteredCompetitors.slice(0, page * PAGE_SIZE)
  const hasMore = paginatedCompetitors.length < filteredCompetitors.length

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-[#2a2a2a] bg-[#0a0a0a] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="text-[#a0a0a0] hover:text-[#f0f0f0] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-lg font-semibold text-[#f0f0f0]">BJJ Scout</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#666]" />
          </div>
        ) : error ? (
          <div className="text-sm text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-md px-4 py-3">
            {error}
          </div>
        ) : (
          <>
            {/* Event header */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-semibold text-[#f0f0f0]">
                    {event?.name || `Event ${eventId}`}
                  </h1>
                  {event?.org && (
                    <p className="text-sm text-[#a0a0a0] mt-0.5">{event.org}</p>
                  )}
                  {event?.location && (
                    <p className="text-xs text-[#666] mt-0.5">{event.location}</p>
                  )}
                </div>
                {event?.org && (
                  <button
                    onClick={() => setShowRuleset(true)}
                    className="flex items-center gap-1.5 border border-[#2a2a2a] text-[#a0a0a0] px-3 py-1.5 rounded-md hover:border-[#444] transition-colors text-xs shrink-0"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    View Ruleset
                  </button>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-[#666]">
                  {filteredCompetitors.length} competitor{filteredCompetitors.length !== 1 ? "s" : ""}
                  {selectedCategory ? ` in ${selectedCategory}` : " total"}
                </span>
              </div>
            </div>

            {/* Filters */}
            {categories.length > 0 && (
              <FilterBar
                categories={categories}
                selected={selectedCategory}
                onSelect={(cat) => {
                  setSelectedCategory(cat)
                  setPage(1)
                }}
              />
            )}

            {/* Competitor list */}
            {paginatedCompetitors.length === 0 ? (
              <div className="text-center py-12 text-[#666] text-sm">
                No competitors found.
              </div>
            ) : (
              <div className="space-y-1 mt-4">
                {paginatedCompetitors.map((competitor, idx) => (
                  <CompetitorCard
                    key={`${competitor.name}-${idx}`}
                    competitor={competitor}
                    onClick={() =>
                      router.push(
                        `/event/${eventId}/competitor/${encodeURIComponent(competitor.name)}`
                      )
                    }
                  />
                ))}
              </div>
            )}

            {/* Load more */}
            {hasMore && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="border border-[#2a2a2a] text-[#a0a0a0] px-4 py-2 rounded-md hover:border-[#444] transition-colors text-sm flex items-center gap-2"
                >
                  Load more
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Ruleset modal */}
      {showRuleset && event?.org && (
        <RulesetModal org={event.org} onClose={() => setShowRuleset(false)} />
      )}
    </div>
  )
}
