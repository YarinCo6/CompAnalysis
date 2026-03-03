"use client"

import { useState, useEffect, FormEvent, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Loader2, X, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import { EventCard } from "@/components/EventCard"

interface EventResult {
  id: string
  name: string
  date: string
  org: string
  location: string
  url: string
  competitorCount?: number
}

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialQuery = searchParams.get("q") || ""
  const [query, setQuery] = useState(initialQuery)
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<EventResult[]>([])
  const [searchError, setSearchError] = useState("")
  const [hasSearched, setHasSearched] = useState(false)

  const [upcomingEvents, setUpcomingEvents] = useState<EventResult[]>([])
  const [loadingUpcoming, setLoadingUpcoming] = useState(true)
  const [upcomingError, setUpcomingError] = useState("")

  useEffect(() => {
    async function fetchUpcoming() {
      try {
        const res = await fetch("/api/upcoming-events")
        if (!res.ok) throw new Error("Failed")
        const data = await res.json()
        setUpcomingEvents(data.events || [])
      } catch {
        setUpcomingError("Could not load upcoming events.")
      } finally {
        setLoadingUpcoming(false)
      }
    }
    fetchUpcoming()
  }, [])

  // Auto-search if URL has ?q=
  useEffect(() => {
    if (initialQuery) {
      runSearch(initialQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function runSearch(q: string) {
    if (!q.trim()) return
    setSearching(true)
    setSearchError("")
    setHasSearched(true)
    // Update URL without navigation
    const url = new URL(window.location.href)
    url.searchParams.set("q", q.trim())
    window.history.replaceState({}, "", url.toString())

    try {
      const res = await fetch("/api/search-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")
      setSearchResults(data.events || [])
    } catch (err) {
      setSearchError((err as Error).message || "Search failed.")
    } finally {
      setSearching(false)
    }
  }

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    await runSearch(query)
  }

  function clearSearch() {
    setQuery("")
    setHasSearched(false)
    setSearchResults([])
    setSearchError("")
    const url = new URL(window.location.href)
    url.searchParams.delete("q")
    window.history.replaceState({}, "", url.toString())
  }

  function goToEvent(event: EventResult) {
    router.push(
      `/event/${event.id}?name=${encodeURIComponent(event.name)}&location=${encodeURIComponent(event.location || "")}&date=${encodeURIComponent(event.date || "")}`
    )
  }

  const displayEvents = hasSearched ? searchResults : upcomingEvents

  return (
    <div className="min-h-screen bg-[#080808]">
      <header className="border-b border-[#1e1e1e] bg-[#080808]/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={clearSearch} className="shrink-0">
            <span className="text-base font-bold bg-gradient-to-r from-[#3b82f6] to-[#6366f1] bg-clip-text text-transparent">
              BJJ Scout
            </span>
          </button>

          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search events..."
                className="w-full bg-[#111] border border-[#222] rounded-lg pl-9 pr-8 py-2 text-sm text-[#f0f0f0] placeholder-[#555] outline-none focus:border-[#3b82f6]/50 focus:bg-[#131313] transition-all"
              />
              {query && (
                <button type="button" onClick={clearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#888]">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button type="submit" disabled={searching || !query.trim()}
              className="bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 text-sm shrink-0">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </form>

          <button onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-[#555] hover:text-[#888] transition-colors shrink-0" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-5 flex items-center justify-between">
          {hasSearched ? (
            <div className="flex items-center gap-3">
              <p className="text-sm text-[#888]">
                {searching ? "Searching..." : (
                  <>{searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for{" "}
                    <span className="text-[#f0f0f0] font-medium">"{query}"</span></>
                )}
              </p>
              <button onClick={clearSearch}
                className="flex items-center gap-1 text-xs text-[#555] hover:text-[#888]">
                <X className="w-3 h-3" /> Clear
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[#f0f0f0]">Upcoming Events</h2>
              {!loadingUpcoming && upcomingEvents.length > 0 && (
                <span className="text-xs bg-[#1e1e1e] text-[#666] px-2 py-0.5 rounded-full border border-[#2a2a2a]">
                  {upcomingEvents.length}
                </span>
              )}
            </div>
          )}
        </div>

        {searchError && (
          <div className="text-sm text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg px-4 py-3 mb-4">
            {searchError}
          </div>
        )}
        {upcomingError && !hasSearched && (
          <div className="text-sm text-[#666] bg-[#111] border border-[#1e1e1e] rounded-lg px-4 py-3 mb-4">
            {upcomingError}
          </div>
        )}

        {(loadingUpcoming && !hasSearched) || searching ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#3b82f6]" />
            <p className="text-sm text-[#555]">
              {searching ? "Searching Smoothcomp..." : "Loading upcoming events..."}
            </p>
          </div>
        ) : displayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <Search className="w-8 h-8 text-[#333]" />
            <p className="text-sm text-[#555]">
              {hasSearched ? `No events found for "${query}"` : "No upcoming events found."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayEvents.map(event => (
              <EventCard key={event.id} event={event} onClick={() => goToEvent(event)} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#3b82f6]" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
